let currentLang = 'zh';

// 每个 Tab 独立背景图（疑惑求解换用超高稳定性背景）
const tabBackgrounds = {
  'notice': "url('https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1920&q=80')", 
  'posts': "url('bg.jpg')", // 本地 bg.jpg
  'qa': "url('https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1920&q=80')", // 疑惑求解 (禅茶山寺)
  'drain': "url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80')" 
};

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  const activeContent = document.getElementById(`section-${tabName}`);
  const activeBtn = document.getElementById(`tab-btn-${tabName}`);

  if (activeContent) activeContent.classList.add('active');
  if (activeBtn) activeBtn.classList.add('active');

  // 背景图片加保底，确保不会一片空白
  const bgUrl = tabBackgrounds[tabName] || tabBackgrounds['posts'];
  document.body.style.backgroundImage = `linear-gradient(rgba(254, 243, 199, 0.3), rgba(254, 243, 199, 0.3)), ${bgUrl}`;
  document.body.style.backgroundColor = "#FEF3C7"; // 备用底色
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundAttachment = "fixed";
}

function toggleLanguage() {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  document.getElementById('langBtn').innerText = currentLang === 'zh' ? 'English' : '中文';
  
  const i18n = {
    zh: {
      title: "🌸 佛学修学社区", tabNotice: "社区公告", tabPosts: "随喜心得", tabQA: "疑惑求解", tabDrain: "情绪排水沟",
      adminTitle: "📢 发布社区公告 (仅管理员)", pub1: "发布公告", pub2: "合十发布", pub3: "请教疑惑", pub4: "倾诉保存",
      drainHint: "🔒 绝对私密：此处内容仅您自己可见，师父与其他同修完全无法查看。",
      ruleTitle: "🌺 同修修学公约", ruleBtn: "我已阅读并遵守公约", authTitle: "同修登录与注册",
      r1: "同修", r2: "师父", loginBtn: "登录", regBtn: "注册新账号"
    },
    en: {
      title: "🌸 Buddhist Community", tabNotice: "Announcements", tabPosts: "Insights", tabQA: "Q & A", tabDrain: "Private Journal",
      adminTitle: "📢 Post Announcement (Admin Only)", pub1: "Publish", pub2: "Post", pub3: "Ask Question", pub4: "Save Journal",
      drainHint: "🔒 Private: Visible only to you. Masters and others cannot see this.",
      ruleTitle: "🌺 Community Guidelines", ruleBtn: "I Agree & Accept", authTitle: "Login & Register",
      r1: "Practitioner", r2: "Master", loginBtn: "Login", regBtn: "Register"
    }
  };

  const t = i18n[currentLang];
  document.getElementById('t-appTitle').innerText = t.title;
  document.getElementById('t-tabNotice').innerText = t.tabNotice;
  document.getElementById('t-tabPosts').innerText = t.tabPosts;
  document.getElementById('t-tabQA').innerText = t.tabQA;
  document.getElementById('t-tabDrain').innerText = t.tabDrain;
  document.getElementById('t-adminTitle').innerText = t.adminTitle;
  document.getElementById('t-pubBtn1').innerText = t.pub1;
  document.getElementById('t-pubBtn2').innerText = t.pub2;
  document.getElementById('t-pubBtn3').innerText = t.pub3;
  document.getElementById('t-pubBtn4').innerText = t.pub4;
  document.getElementById('t-drainHint').innerText = t.drainHint;
  document.getElementById('t-ruleTitle').innerText = t.ruleTitle;
  document.getElementById('t-ruleBtn').innerText = t.ruleBtn;
  document.getElementById('t-authTitle').innerText = t.authTitle;
  document.getElementById('t-r1').innerText = t.r1;
  document.getElementById('t-r2').innerText = t.r2;
  document.getElementById('t-loginBtn').innerText = t.loginBtn;
  document.getElementById('t-regBtn').innerText = t.regBtn;
}