async function submitQA() {
  const aliasInput = document.getElementById('qaAuthorAlias');
  const contentInput = document.getElementById('qaContent');
  const fileInput = document.getElementById('qaImage');

  const alias = aliasInput ? aliasInput.value.trim() : '';
  const content = contentInput ? contentInput.value.trim() : '';
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (!content && !file) {
    alert("请填写疑惑内容或选择一张图片！");
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

  const textValue = content || (file ? "[图片提问]" : "同修提问");

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
    if (aliasInput) aliasInput.value = '';
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
    console.error("加载疑惑失败:", error);
    return;
  }

  const currentUsername = currentUser ? currentUser.username : '';
  const isMaster = currentUser && currentUser.role === '师父';
  const isMasterOrAdmin = currentUser && (currentUser.role === '师父' || currentUser.role === '管理员');

  container.innerHTML = (data || []).map(item => {
    // 关键权限：只有提问者本人、或者师父/管理员可以删除，其他人绝对看不到删除按钮
    const canDelete = currentUser && (isMasterOrAdmin || item.username === currentUsername);

    return `
      <div class="card" style="position:relative; background:#FFF; border:1px solid #E5E7EB; border-radius:8px; padding:12px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-weight:bold; color:#78350F; margin-bottom:6px;">${item.username || '同修'} 提问：</div>
          ${canDelete ? `<button onclick="deleteQA(${item.id})" style="background:#EF4444; color:white; border:none; padding:2px 6px; border-radius:4px; font-size:11px; cursor:pointer;">删除</button>` : ''}
        </div>
        <p style="white-space: pre-wrap; margin:5px 0; color:#374151;">${item.content || item.question || ''}</p>
        ${item.image_url ? `<img src="${item.image_url}" class="card-img" style="max-width:100%; border-radius:8px; margin-top:8px;">` : ''}
        
        <!-- 所有人都能看已发布的师父开示 -->
        ${item.answer ? `
          <div style="background:#FEF3C7; padding:10px; border-radius:6px; margin-top:10px; font-size:13px; color:#92400E; border-left:3px solid #D97706;">
            <b>☸️ ${item.master_name || '师父'}开示：</b> ${item.answer}
          </div>
        ` : ''}

        <!-- 只有师父页面才显示专属开示回复输入框 -->
        ${isMaster && !item.answer ? `
          <div style="margin-top:12px; background:#FEF3C7; padding:10px; border-radius:6px;">
            <textarea id="answerInput_${item.id}" class="input-field" rows="2" placeholder="在此输入师父开示..." style="width:100%; box-sizing:border-box; margin-bottom:5px; padding:6px; border:1px solid #D97706; border-radius:4px;"></textarea>
            <button class="btn-primary" style="font-size:12px; padding:4px 10px; background:#D97706; color:white; border:none; border-radius:4px; cursor:pointer;" onclick="submitAnswer(${item.id})">发布开示</button>
          </div>
        ` : ''}

        <div style="font-size:11px; color:#9CA3AF; margin-top:8px;">
          ${new Date(item.created_at).toLocaleString()}
        </div>
      </div>
    `;
  }).join('');
}

async function submitAnswer(qaId) {
  const answerInput = document.getElementById(`answerInput_${qaId}`);
  const answerText = answerInput ? answerInput.value.trim() : '';

  if (!answerText) {
    alert("请输入开示回复内容！");
    return;
  }

  const masterName = currentUser ? currentUser.username : '师父';

  const { error } = await supabaseClient
    .from('qa')
    .update({ 
      answer: answerText,
      master_name: masterName
    })
    .eq('id', qaId);

  if (error) {
    alert("回复失败：" + error.message);
  } else {
    alert("开示已发布！");
    fetchQA();
  }
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