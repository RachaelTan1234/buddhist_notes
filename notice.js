async function submitNotice() {
  const isAdmin = currentUser && (currentUser.role === '管理员' || currentUser.username.toLowerCase() === 'admin');
  if (!isAdmin) {
    alert("只有管理员才可以发布社区公告！");
    return;
  }

  const contentInput = document.getElementById('noticeContent');
  const fileInput = document.getElementById('noticeImage');
  const content = contentInput ? contentInput.value.trim() : '';
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (!content && !file) {
    alert("请填写公告内容或选择一张图片！");
    return;
  }

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

  const textValue = content || (file ? "[图片公告]" : "社区公告");

  const { error } = await supabaseClient
    .from('notice')
    .insert([{ 
      title: textValue,
      content: content || null, 
      image_url: imageUrl 
    }]);

  if (error) {
    alert("发布公告失败：" + error.message);
    console.error(error);
  } else {
    if (contentInput) contentInput.value = '';
    if (fileInput) fileInput.value = '';
    const fileNameSpan = document.getElementById('noticeFileName');
    if (fileNameSpan) fileNameSpan.innerText = '';
    alert("公告发布成功！");
    fetchNotices();
  }
}

async function fetchNotices() {
  const container = document.getElementById('noticeContainer');
  if (!container) return;

  const { data, error } = await supabaseClient
    .from('notice')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const isAdmin = currentUser && (currentUser.role === '管理员' || currentUser.username.toLowerCase() === 'admin');

  container.innerHTML = (data || []).map(item => `
    <div class="card" style="position:relative;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="font-weight:bold; color:#78350F; margin-bottom:6px;">${item.title || '社区公告'}</div>
        ${isAdmin ? `<button onclick="deleteNotice(${item.id})" style="background:#EF4444; color:white; border:none; padding:2px 6px; border-radius:4px; font-size:11px; cursor:pointer;">删除</button>` : ''}
      </div>
      ${item.content && item.content !== item.title ? `<p style="white-space: pre-wrap; margin-top:0;">${item.content}</p>` : ''}
      ${item.image_url ? `<img src="${item.image_url}" class="card-img" style="max-width:100%; border-radius:8px; margin-top:8px;">` : ''}
      <div style="font-size:11px; color:#9CA3AF; margin-top:8px;">
        ${new Date(item.created_at).toLocaleString()}
      </div>
    </div>
  `).join('');
}

async function deleteNotice(id) {
  if (!confirm("确定要删除这条公告吗？")) return;
  const { error } = await supabaseClient
    .from('notice')
    .delete()
    .eq('id', id);

  if (error) {
    alert("删除失败：" + error.message);
  } else {
    fetchNotices();
  }
}

document.addEventListener('DOMContentLoaded', fetchNotices);