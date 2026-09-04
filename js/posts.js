async function submitPost() {
  const aliasInput = document.getElementById('postAuthorAlias');
  const contentInput = document.getElementById('postContent');
  const fileInput = document.getElementById('postImage');

  const alias = aliasInput ? aliasInput.value.trim() : '';
  const content = contentInput ? contentInput.value.trim() : '';
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (!content && !file) {
    alert("请填写随喜心得或选择一张图片！");
    return;
  }

  const username = alias || (currentUser ? currentUser.username : '同修');

  let imageUrl = null;
  if (file) {
    if (typeof uploadImageFile === 'function') {
      imageUrl = await uploadImageFile(file);
    }
    if (!imageUrl) {
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }
  }

  const { error } = await supabaseClient
    .from('posts')
    .insert([{
      username: username,
      content: content || null,
      image_url: imageUrl,
      likes: 0,
      liked_users: [], // 存储点赞过的用户标识，防止无限刷赞
      comments: []
    }]);

  if (error) {
    alert("发布失败：" + error.message);
    console.error(error);
  } else {
    if (aliasInput) aliasInput.value = '';
    if (contentInput) contentInput.value = '';
    if (fileInput) fileInput.value = '';
    const fileNameSpan = document.getElementById('postFileName');
    if (fileNameSpan) fileNameSpan.innerText = '';
    alert("心得随喜发布成功！");
    fetchPosts();
  }
}

async function fetchPosts() {
  const container = document.getElementById('postsContainer');
  if (!container) return;

  const { data, error } = await supabaseClient
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("加载随喜心得失败:", error);
    return;
  }

  const currentUsername = currentUser ? currentUser.username : '';
  const isMasterOrAdmin = currentUser && (currentUser.role === '师父' || currentUser.role === '管理员');

  container.innerHTML = (data || []).map(item => {
    // 关键权限：只有“发布者本人”或“管理员/师父”可以删除，其他人绝对看不到删除按钮
    const canDelete = currentUser && (isMasterOrAdmin || item.username === currentUsername);

    const likedUsers = item.liked_users || [];
    const hasLiked = currentUsername && likedUsers.includes(currentUsername);
    const likeCount = item.likes || likedUsers.length || 0;

    const comments = item.comments || [];

    return `
      <div class="card" style="position:relative; background:#FFF; border:1px solid #E5E7EB; border-radius:8px; padding:12px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-weight:bold; color:#78350F; margin-bottom:6px;">${item.username || '同修'} 随喜心得：</div>
          ${canDelete ? `<button onclick="deletePost(${item.id})" style="background:#EF4444; color:white; border:none; padding:2px 6px; border-radius:4px; font-size:11px; cursor:pointer;">删除</button>` : ''}
        </div>
        <p style="white-space: pre-wrap; margin:5px 0; color:#374151;">${item.content || ''}</p>
        ${item.image_url ? `<img src="${item.image_url}" class="card-img" style="max-width:100%; border-radius:8px; margin-top:8px;">` : ''}
        
        <!-- 点赞与评论互动区 -->
        <div style="display:flex; align-items:center; gap:15px; margin-top:10px; font-size:12px;">
          <button onclick="toggleLike(${item.id})" style="background:${hasLiked ? '#FEE2E2' : '#F3F4F6'}; border:1px solid ${hasLiked ? '#EF4444' : '#D1D5DB'}; color:${hasLiked ? '#DC2626' : '#374151'}; padding:4px 10px; border-radius:15px; cursor:pointer;">
            ❤️ 赞 <span id="like-count-${item.id}">${likeCount}</span> ${hasLiked ? '(已赞)' : ''}
          </button>
        </div>

        <!-- 评论列表 -->
        <div style="margin-top:10px; background:#F9FAFB; padding:8px; border-radius:6px;">
          <div style="font-size:11px; color:#6B7280; margin-bottom:4px; font-weight:bold;">同修交流心得：</div>
          <div id="comments-list-${item.id}">
            ${comments.map(c => `
              <div style="font-size:12px; margin-bottom:4px; border-bottom:1px dashed #E5E7EB; padding-bottom:3px;">
                <b style="color:#78350F;">${c.username}：</b> <span style="color:#374151;">${c.text}</span>
              </div>
            `).join('')}
          </div>
          <div style="display:flex; gap:6px; margin-top:6px;">
            <input type="text" id="commentInput_${item.id}" class="input-field" placeholder="写下您的随喜感言..." style="flex:1; padding:4px 8px; font-size:12px; margin:0;">
            <button class="btn-primary" style="font-size:11px; padding:4px 8px;" onclick="submitComment(${item.id})">发送</button>
          </div>
        </div>

        <div style="font-size:11px; color:#9CA3AF; margin-top:8px;">
          ${new Date(item.created_at).toLocaleString()}
        </div>
      </div>
    `;
  }).join('');
}

// 独家设计的防连点机制：一人一次，再点取消点赞
async function toggleLike(postId) {
  if (!currentUser || !currentUser.username) {
    alert("请先登录账号后才能点赞随喜！");
    return;
  }

  const username = currentUser.username;

  // 先获取当前文章的点赞数组
  const { data: postData, error: fetchError } = await supabaseClient
    .from('posts')
    .select('liked_users, likes')
    .eq('id', postId)
    .single();

  if (fetchError) {
    alert("点赞操作失败");
    return;
  }

  let likedUsers = postData.liked_users || [];
  let likes = postData.likes || 0;

  const index = likedUsers.indexOf(username);
  if (index > -1) {
    // 已经赞过 -> 取消点赞
    likedUsers.splice(index, 1);
    likes = Math.max(0, likes - 1);
  } else {
    // 没赞过 -> 加上点赞
    likedUsers.push(username);
    likes += 1;
  }

  const { error } = await supabaseClient
    .from('posts')
    .update({ 
      liked_users: likedUsers,
      likes: likes 
    })
    .eq('id', postId);

  if (error) {
    alert("点赞更新失败：" + error.message);
  } else {
    fetchPosts();
  }
}

async function submitComment(postId) {
  const input = document.getElementById(`commentInput_${postId}`);
  const text = input ? input.value.trim() : '';

  if (!text) return;

  const username = currentUser ? currentUser.username : '同修';

  const { data: postData, error: fetchError } = await supabaseClient
    .from('posts')
    .select('comments')
    .eq('id', postId)
    .single();

  if (fetchError) {
    alert("发表评论失败");
    return;
  }

  const comments = postData.comments || [];
  comments.push({ username, text, time: new Date().toISOString() });

  const { error } = await supabaseClient
    .from('posts')
    .update({ comments: comments })
    .eq('id', postId);

  if (error) {
    alert("评论失败：" + error.message);
  } else {
    input.value = '';
    fetchPosts();
  }
}

async function deletePost(id) {
  if (!confirm("确定要删除这条随喜心得吗？")) return;
  const { error } = await supabaseClient
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) {
    alert("删除失败：" + error.message);
  } else {
    fetchPosts();
  }
}

document.addEventListener('DOMContentLoaded', fetchPosts);