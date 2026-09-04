async function submitDrain() {
  const contentInput = document.getElementById('drainContent');
  const fileInput = document.getElementById('drainImage');

  const content = contentInput ? contentInput.value.trim() : '';
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (!content && !file) {
    alert("请填写内容或选择一张图片！");
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

  // 本地私密存储
  const drainLogs = JSON.parse(localStorage.getItem('drainLogs') || '[]');
  drainLogs.unshift({
    id: Date.now(),
    content: content || '',
    image_url: imageUrl,
    created_at: new Date().toISOString()
  });

  localStorage.setItem('drainLogs', JSON.stringify(drainLogs));

  if (contentInput) contentInput.value = '';
  if (fileInput) fileInput.value = '';
  const fileNameSpan = document.getElementById('drainFileName');
  if (fileNameSpan) fileNameSpan.innerText = '';
  alert("倾诉成功，仅存存于本地。");
  fetchDrainMessages();
}

// 情绪排水沟：读取与展示（带有删除按钮）
function fetchDrainMessages() {
  const container = document.getElementById('drainContainer');
  if (!container) return;

  const drainLogs = JSON.parse(localStorage.getItem('drainLogs') || '[]');

  if (drainLogs.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:#9CA3AF; padding:20px;">暂无私密记录</div>`;
    return;
  }

  container.innerHTML = drainLogs.map(item => `
    <div class="card" style="position:relative;">
      ${item.content ? `<p style="white-space: pre-wrap; margin:5px 0;">${item.content}</p>` : ''}
      ${item.image_url ? `<img src="${item.image_url}" class="card-img" style="max-width:100%; border-radius:8px; margin-top:8px;">` : ''}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
        <span style="font-size:11px; color:#9CA3AF;">${new Date(item.created_at).toLocaleString()}</span>
        <button onclick="deleteDrainMessage(${item.id})" style="background:#EF4444; color:white; border:none; padding:3px 8px; border-radius:4px; font-size:12px; cursor:pointer;">删除</button>
      </div>
    </div>
  `).join('');
}

// 删除情绪排水沟单条记录
function deleteDrainMessage(id) {
  if (!confirm("确定要删除这条私密记录吗？删除后无法恢复。")) return;
  let drainLogs = JSON.parse(localStorage.getItem('drainLogs') || '[]');
  drainLogs = drainLogs.filter(item => item.id !== id);
  localStorage.setItem('drainLogs', JSON.stringify(drainLogs));
  fetchDrainMessages();
}

document.addEventListener('DOMContentLoaded', fetchDrainMessages);