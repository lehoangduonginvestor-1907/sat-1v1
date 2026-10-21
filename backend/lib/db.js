// Kết nối Supabase qua REST (không cần thư viện): xác thực người dùng + đọc/ghi Elo.
// Thiếu SUPABASE_URL / khoá bí mật thì tắt hẳn: mọi người chơi là khách, không tính Elo.

const BASE = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const enabled = Boolean(BASE && KEY);

// Khoá kiểu mới (sb_secret_...) chỉ đặt ở header apikey; khoá JWT kiểu cũ đặt cả Authorization
function keyHeaders() {
  return KEY.startsWith('sb_') ? { apikey: KEY } : { apikey: KEY, Authorization: `Bearer ${KEY}` };
}

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    method,
    headers: { ...keyHeaders(), 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// Access token (JWT của Supabase Auth) -> { id, name, avatarUrl } hoặc null nếu không hợp lệ
async function verifyUser(token) {
  if (!enabled || typeof token !== 'string' || !token) return null;
  const res = await fetch(`${BASE}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const u = await res.json();
  if (!u?.id) return null;
  const meta = u.user_metadata || {};
  return {
    id: u.id,
    name: String(meta.full_name || meta.name || (u.email || '').split('@')[0] || 'Player').slice(0, 40),
    avatarUrl: meta.avatar_url || meta.picture || null,
  };
}

// Tạo hồ sơ lần đầu đăng nhập; các lần sau chỉ cập nhật tên/ảnh, giữ nguyên Elo
function upsertProfile(user) {
  return rest('profiles?on_conflict=id', {
    method: 'POST',
    body: { id: user.id, name: user.name, avatar_url: user.avatarUrl },
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}

function getProfiles(ids) {
  return rest(`profiles?select=id,elo,games&id=in.(${ids.map(encodeURIComponent).join(',')})`);
}

// Ghi trận + cập nhật Elo hai người trong một transaction (hàm SQL record_match)
function recordMatch(params) {
  return rest('rpc/record_match', { method: 'POST', body: params });
}

function leaderboard() {
  return rest('profiles?select=id,name,avatar_url,elo,games,wins,losses,draws&order=elo.desc,games.desc,created_at.asc');
}

module.exports = { enabled, verifyUser, upsertProfile, getProfiles, recordMatch, leaderboard };
