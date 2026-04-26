const { verifyAccessToken } = require('../utils/tokenUtils');
const supabase = require('../config/db');

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const decoded = verifyAccessToken(token);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, city, is_verified')
      .eq('id', decoded.userId)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ success: false, message: 'Email not verified' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token expired or invalid' });
  }
}

module.exports = authMiddleware;
