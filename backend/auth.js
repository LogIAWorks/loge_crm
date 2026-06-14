// Autenticación vía Supabase: valida el token (JWT) que envía el frontend
// preguntando a Supabase con la anon key. Sustituye al antiguo X-CRM-API-KEY.
// No guarda ningún secreto: la anon key es pública por diseño.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Caché en memoria token->{ user, exp } para no llamar a Supabase en cada request.
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000;

async function validateToken(token) {
  const cached = cache.get(token);
  if (cached && cached.exp > Date.now()) return cached.user;

  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) return null;
  const user = await resp.json();
  if (!user || !user.id) return null;
  cache.set(token, { user, exp: Date.now() + CACHE_TTL_MS });
  return user;
}

const requireAuth = async (req, res, next) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Auth no configurada en el servidor' });
  }
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const user = await validateToken(token);
    if (!user) return res.status(401).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Error validando autenticación' });
  }
};

module.exports = { requireAuth };
