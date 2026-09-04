async function submitQA() {
  const contentInput = document.getElementById('qaContent');
  const fileInput = document.getElementById('qaImage');
  const content = contentInput ? contentInput.value.trim() : '';
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (!content && !file) {
    alert("请填写疑惑内容或选择一张图片！");
    return;
  }

  const username = currentUser ? currentUser.username : '同修';

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

  const textValue = content || (file ? "[图片提问]" : "同修提问");

  // 同时传入 question 和 content，避免任何数据库约束报错
  const { error } = await supabaseClient
    .from('qa')
    .insert([{
      username: username,
      question: textValue,
      content: content || null,
      image_url: imageUrl
    }]);

  if (error) {
    alert("提交失败：" + error.message);
    console.error(error);
  } else {
    if (contentInput) contentInput.value = '';
    if (fileInput) fileInput.value = '';
    const fileNameSpan = document.getElementById('qaFileName');
    if (fileNameSpan) fileNameSpan.innerText = '';
    alert("问题已发布！");
    fetchQA();
  }
}

async function fetchQA() {
  const container = document.getElementById('qaContainer');
  if (!container) return;

  const { data, error } = await supabaseClient
    .from('qa')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const currentUsername = currentUser ? currentUser.username : '';

  container.innerHTML = (data || []).map(item => {
    const canDelete = currentUser && (currentUser.role === '管理员' || item.username === currentUsername);

    return `
      <div class="card" style="position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-weight:bold; color:#78350F; margin-bottom:6px;">${item.username || '同修'} 提问：</div>
          ${canDelete ? `<button onclick="deleteQA(${item.id})" style="background:#EF4444; color:white; border:none; padding:2px 6px; border-radius:4px; font-size:11px; cursor:pointer;">删除</button>` : ''}
        </div>
        <p style="white-space: pre-wrap; margin:5px 0;">${item.content || item.question || ''}</p>
        ${item.image_url ? `<img src="${item.image_url}" class="card-img" style="max-width:100%; border-radius:8px; margin-top:8px;">` : ''}
        
        ${item.answer ? `
          <div style="background:#FEF3C7; padding:8px; border-radius:6px; margin-top:8px; font-size:13px; color:#92400E;">
            <b>${item.master_name || '师父'}回复：</b> ${item.answer}
          </div>
        ` : ''}

        <div style="font-size:11px; color:#9CA3AF; margin-top:8px;">
          ${new Date(item.created_at).toLocaleString()}
        </div>
      </div>
    `;
  }).join('');
}

async function deleteQA(id) {
  if (!confirm("确定要删除这条提问吗？")) return;
  const { error } = await supabaseClient
    .from('qa')
    .delete()
    .eq('id', id);

  if (error) {
    alert("删除失败：" + error.message);
  } else {
    fetchQA();
  }
}

document.addEventListener('DOMContentLoaded', fetchQA);