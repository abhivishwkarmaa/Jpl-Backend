const { verifyToken } = require('../lib/auth');

function requireAdminAuth(req, res, next) {
  let token = null;

  if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

module.exports = { requireAdminAuth };
