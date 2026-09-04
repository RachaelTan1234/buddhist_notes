async function submitDrain() {
  const contentInput = document.getElementById('drainContent');
  const fileInput = document.getElementById('drainImage');

  const content = contentInput ? contentInput.value.trim() : '';
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (!currentUser || !currentUser.username) {
    alert("请先登录账号，才能使用情绪排水沟！");
    return;
  }

  if (!content && !file) {
    alert("请填写倾诉内容或选择一张图片！");
    return;
  }

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

  // 关键：发布时必须绑定当前登录的 username，确保私密归属
  const { error } = await supabaseClient
    .from('diary')
    .insert([{
      username: currentUser.username,
      content: content || null,
      image_url: imageUrl
    }]);

  if (error) {
    alert("保存失败：" + error.message);
    console.error(error);
  } else {
    if (contentInput) contentInput.value = '';
    if (fileInput) fileInput.value = '';
    const fileNameSpan = document.getElementById('drainFileName');
    if (fileNameSpan) fileNameSpan.innerText = '';
    alert("心事已安全倾诉并私密保存。");
    fetchDrain();
  }
}

async function fetchDrain() {
  const container = document.getElementById('drainContainer');
  if (!container) return;

  if (!currentUser || !currentUser.username) {
    container.innerHTML = `<div class="card" style="text-align:center; color:#D97706;">请先登录账号，才能查看您的私密情绪排水沟。</div>`;
    return;
  }

  // 关键：严格只查询当前登录用户自己的日记，其他人绝对查不到
  const { data, error } = await supabaseClient
    .from('diary')
    .select('*')
    .eq('username', currentUser.username)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("加载排水沟失败:", error);
    return;
  }

  container.innerHTML = (data || []).map(item => `
    <div class="card" style="position:relative; background:#FFFBEB; border-left:4px solid #D97706; padding:12px; margin-bottom:12px; border-radius:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12px; color:#B45309; font-weight:bold;">🔒 绝对私密（仅自己可见）</span>
        <button onclick="deleteDrain(${item.id})" style="background:#EF4444; color:white; border:none; padding:2px 6px; border-radius:4px; font-size:11px; cursor:pointer;">删除</button>
      </div>
      <p style="white-space: pre-wrap; margin:8px 0; color:#78350F;">${item.content || ''}</p>
      ${item.image_url ? `<img src="${item.image_url}" class="card-img" style="max-width:100%; border-radius:8px; margin-top:8px;">` : ''}
      <div style="font-size:11px; color:#9CA3AF; margin-top:8px;">${new Date(item.created_at).toLocaleString()}</div>
    </div>
  `).join('');
}

async function deleteDrain(id) {
  if (!confirm("确定要删除这条私密倾诉吗？")) return;
  const { error } = await supabaseClient
    .from('diary')
    .delete()
    .eq('id', id);

  if (error) {
    alert("删除失败：" + error.message);
  } else {
    fetchDrain();
  }
}

document.addEventListener('DOMContentLoaded', fetchDrain);