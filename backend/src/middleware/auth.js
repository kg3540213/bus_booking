const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token missing or invalid',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexbus_jwt_secure_key_2026_enterprise');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Session expired or invalid token. Please log in again.',
    });
  }
}

// Optional auth for endpoints where guest or logged in user can both access
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexbus_jwt_secure_key_2026_enterprise');
      req.user = decoded;
    } catch (err) {
      // ignore token error for optional auth
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };

