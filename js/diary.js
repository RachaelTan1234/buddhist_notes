async function fetchDrain() {
  const container = document.getElementById('drainContainer');
  if (!container) return;

  // 如果没有登录，不展示任何私密日记
  if (!currentUser || !currentUser.username) {
    container.innerHTML = `<div class="card" style="text-align:center; color:#D97706;">请先登录账号，才能查看和使用“情绪排水沟”的私密空间。</div>`;
    return;
  }

  // 关键：只查询属于当前登录用户的私密内容！
  const { data, error } = await supabaseClient
    .from('diary')
    .select('*')
    .eq('username', currentUser.username) // 严格限定只能看自己的
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  container.innerHTML = (data || []).map(item => `
    <div class="card" style="position:relative; background:#FFFBEB; border-left:4px solid #D97706;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12px; color:#B45309; font-weight:bold;">🔒 仅自己可见</span>
        <button onclick="deleteDrain(${item.id})" style="background:#EF4444; color:white; border:none; padding:2px 6px; border-radius:4px; font-size:11px; cursor:pointer;">删除</button>
      </div>
      <p style="white-space: pre-wrap; margin:8px 0; color:#78350F;">${item.content || ''}</p>
      ${item.image_url ? `<img src="${item.image_url}" class="card-img" style="max-width:100%; border-radius:8px; margin-top:8px;">` : ''}
      <div style="font-size:11px; color:#9CA3AF; margin-top:8px;">${new Date(item.created_at).toLocaleString()}</div>
    </div>
  `).join('');
}