import { userDb, adminDb } from '../supabase.js';

export async function requireUser(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Sign in required' });
    const { data, error } = await userDb(token).auth.getUser();
    if (error || !data.user) return res.status(401).json({ error: 'Invalid session' });
    req.user = data.user;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function requireAdmin(req, res, next) {
  const { data, error } = await adminDb
    .from('topzy_admins').select('user_id').eq('user_id', req.user.id).maybeSingle();
  if (error || !data) return res.status(403).json({ error: 'Admin access required' });
  next();
}
