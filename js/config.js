// 填入你自己的 Supabase URL 和 Key
const SUPABASE_URL = "https://xbrnivmezfbbrnsmlyub.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhicm5pdm1lemZiYnJuc21seXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDI3ODYsImV4cCI6MjEwNDAxODc4Nn0.nQ1p732-DnJFUKs1iEanyL2810kX2t_YS9EU9ox4Zyk";

// 防错安全初始化
var supabaseClient;
try {
  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.error("Supabase SDK 还没成功加载，请检查网络！");
  }
} catch (e) {
  console.error("Supabase 初始化失败:", e);
}

// 图片上传辅助函数
async function uploadImageFile(file) {
  if (!file || !supabaseClient) return null;
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `img_${Date.now()}_${Math.floor(Math.random()*1000)}.${fileExt}`;

    const { error } = await supabaseClient.storage
      .from('buddhist-images')
      .upload(fileName, file);

    if (!error) {
      const { data } = supabaseClient.storage
        .from('buddhist-images')
        .getPublicUrl(fileName);
      return data ? data.publicUrl : null;
    }
  } catch (e) {
    console.error("图片上传报错", e);
  }
  return null;
}