// 发布随喜心得
async function submitPost() {
  const authorAliasInput = document.getElementById('postAuthorAlias');
  const contentInput = document.getElementById('postContent');
  const fileInput = document.getElementById('postImage');

  const content = contentInput ? contentInput.value.trim() : '';
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (!content && !file) {
    alert("请填写随喜心得或选择一张图片！");
    return;
  }

  const username = (authorAliasInput && authorAliasInput.value.trim()) 
    || (currentUser ? currentUser.username : '匿名同修');

  let imageUrl = null;
  if (file) {
    imageUrl = await uploadImageFile(file);
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
      comments: []
    }]);

  if (error) {
    alert("发布失败：" + error.message);
    console.error(error);
  } else {
    if (contentInput) contentInput.value = '';
    if (fileInput) fileInput.value = '';
    const fileNameSpan = document.getElementById('postFileName');
    if (fileNameSpan) fileNameSpan.innerText = '';
    alert("随喜发布成功！");
    fetchPosts();
  }
}

// 获取并展示随喜心得（带点赞、评论、删除功能）
async function fetchPosts() {
  const container = document.getElementById('postsContainer');
  if (!container) return;

  const { data, error } = await supabaseClient
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const currentUsername = currentUser ? currentUser.username : '';

  container.innerHTML = (data || []).map(item => {
    const commentsList = (item.comments || []).map(c => `
      <div style="font-size:12px; background:#F9FAFB; padding:4px 8px; border-radius:4px; margin-top:4px;">
        <b>${c.username}：</b> ${c.text}
      </div>
    `).join('');

    // 判断是否可删除（如果是管理员或者发布者本人）
    const canDelete = currentUser && (currentUser.role === '管理员' || item.username === currentUsername);

    return `
      <div class="card" style="position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-weight:bold; color:#78350F;">${item.username || '匿名同修'}</div>
          ${canDelete ? `<button onclick="deletePost(${item.id})" style="background:#EF4444; color:white; border:none; padding:2px 6px; border-radius:4px; font-size:11px; cursor:pointer;">删除</button>` : ''}
        </div>

        ${item.content ? `<p style="white-space: pre-wrap; margin:8px 0;">${item.content}</p>` : ''}
        ${item.image_url ? `<img src="${item.image_url}" class="card-img" style="max-width:100%; border-radius:8px; margin-top:8px;">` : ''}
        
        <div style="font-size:11px; color:#9CA3AF; margin-top:8px;">
          ${new Date(item.created_at).toLocaleString()}
        </div>

        <!-- 点赞与评论互动栏 -->
        <div style="display:flex; gap:15px; margin-top:10px; border-top:1px solid #F3F4F6; padding-top:8px; align-items:center;">
          <button onclick="likePost(${item.id}, ${item.likes || 0})" style="background:none; border:none; color:#D97706; cursor:pointer; font-size:13px;">
            👍 随喜赞 (${item.likes || 0})
          </button>
          <button onclick="toggleCommentBox(${item.id})" style="background:none; border:none; color:#4B5563; cursor:pointer; font-size:13px;">
            💬 评论 (${(item.comments || []).length})
          </button>
        </div>

        <!-- 评论折叠输入框 -->
        <div id="comment-box-${item.id}" style="display:none; margin-top:8px;">
          <div style="max-height:100px; overflow-y:auto; margin-bottom:5px;">${commentsList}</div>
          <div style="display:flex; gap:5px;">
            <input type="text" id="comment-input-${item.id}" placeholder="写下您的随喜合十留言..." style="flex:1; padding:4px 8px; border:1px solid #D1D5DB; border-radius:4px; font-size:12px;">
            <button onclick="addComment(${item.id})" style="background:#D97706; color:white; border:none; padding:4px 10px; border-radius:4px; font-size:12px; cursor:pointer;">发送</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 点赞逻辑
async function likePost(id, currentLikes) {
  const { error } = await supabaseClient
    .from('posts')
    .update({ likes: currentLikes + 1 })
    .eq('id', id);

  if (error) {
    alert("点赞失败：" + error.message);
  } else {
    fetchPosts();
  }
}

// 展开/收起评论框
function toggleCommentBox(id) {
  const box = document.getElementById(`comment-box-${id}`);
  if (box) {
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }
}

// 发表评论
async function addComment(id) {
  const input = document.getElementById(`comment-input-${id}`);
  if (!input) return;
  const text = input.value.trim();
  if (!text) {
    alert("请输入评论内容！");
    return;
  }

  const username = currentUser ? currentUser.username : '同修';

  // 先查出当前这篇心得的 comments 数组
  const { data: postData, error: fetchError } = await supabaseClient
    .from('posts')
    .select('comments')
    .eq('id', id)
    .single();

  if (fetchError) {
    alert("获取评论失败");
    return;
  }

  const currentComments = postData.comments || [];
  currentComments.push({ username, text, time: new Date().toISOString() });

  const { error } = await supabaseClient
    .from('posts')
    .update({ comments: currentComments })
    .eq('id', id);

  if (error) {
    alert("评论失败：" + error.message);
  } else {
    input.value = '';
    fetchPosts();
  }
}

// 删除随喜心得
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