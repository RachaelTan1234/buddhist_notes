let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let userIP = '未知';

// 获取真实 IP
fetch('https://api.ipify.org?format=json')
  .then(res => res.json())
  .then(data => userIP = data.ip)
  .catch(() => userIP = '127.0.0.1');

// 接受公网公约
function acceptRules() {
  document.getElementById('rulesModal').style.display = 'none';
  if (!currentUser) {
    document.getElementById('authModal').style.display = 'flex';
  }
}

// 登录与注册核心逻辑
async function handleAuth(type) {
  const usernameInput = document.getElementById('authUsername');
  const passwordInput = document.getElementById('authPassword');
  
  if (!usernameInput || !passwordInput) {
    alert("找不到输入框，请检查 HTML id 命名");
    return;
  }

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const roleElement = document.querySelector('input[name="userRole"]:checked');
  const selectedRole = roleElement ? roleElement.value : '同修';

  if (!username || !password) {
    alert("请填写账号和密码！");
    return;
  }

  // 暗号：输入密码 admin123 自动提升为管理者
  const isAdminByPass = (password === 'admin123');
  const finalRole = isAdminByPass ? '管理员' : selectedRole;

  try {
    if (type === 'register') {
      // 1. 注册新账号
      const { data, error } = await supabaseClient
        .from('users')
        .insert([{ username, password, role: finalRole }]);

      if (error) {
        alert("注册失败：" + error.message);
        console.error("注册报错：", error);
        return;
      }

      alert(`注册成功！${isAdminByPass ? '（已自动提升为管理员）' : ''} 请点击“登录”。`);

    } else if (type === 'login') {
      // 2. 登录验证
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        alert("登录查询失败：" + error.message);
        return;
      }

      if (!data) {
        alert("账号或密码错误，请检查！");
        return;
      }

      // 保存登录状态
      currentUser = {
        username: data.username,
        role: isAdminByPass ? '管理员' : data.role
      };

      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      document.getElementById('authModal').style.display = 'none';
      updateUserUI();
      alert("登录成功！ welcome: " + currentUser.username);
    }
  } catch (err) {
    alert("网络或代码异常：" + err.message);
    console.error(err);
  }
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  location.reload();
}

function updateUserUI() {
  if (!currentUser) return;
  
  // 显示用户名和身份
  const display = document.getElementById('userInfoDisplay');
  if (display) display.innerText = `${currentUser.username} (${currentUser.role})`;

  // 显示退出登录按钮
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.style.display = 'inline-block';

  // ⚠️ 关键点：判断是否为管理员，控制公告发布框的显示与隐藏
  const isAdmin = (currentUser.role === '管理员' || currentUser.username.toLowerCase() === 'admin');
  const adminBox = document.getElementById('adminNoticePublish');
  if (adminBox) {
    adminBox.style.display = isAdmin ? 'block' : 'none';
  }

  // 刷新私密排水沟数据
  if (typeof fetchDrainMessages === 'function') fetchDrainMessages();
}

  // 刷新私密苦水 Tab 数据
  if (typeof fetchDrainMessages === 'function') fetchDrainMessages();

// 页面加载自动检查登录状态
document.addEventListener('DOMContentLoaded', () => {
  if (currentUser) {
    const rulesModal = document.getElementById('rulesModal');
    const authModal = document.getElementById('authModal');
    if (rulesModal) rulesModal.style.display = 'none';
    if (authModal) authModal.style.display = 'none';
    updateUserUI();
  }
});