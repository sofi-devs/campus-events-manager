// Route-guard middleware used to protect actions.

function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please log in to continue.' };
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.session.flash = { type: 'error', message: 'Admin access is required for that.' };
    return res.redirect('/');
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
