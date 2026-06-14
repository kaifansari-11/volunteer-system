// Ensure user is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  req.flash('error', 'Please login to continue.');
  res.redirect('/auth/login');
}

// Ensure user is admin
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error', 'Access denied. Admins only.');
  res.redirect('/auth/login');
}

// Ensure user is NOT logged in (for login/register pages)
function isGuest(req, res, next) {
  if (!req.session || !req.session.user) return next();
  if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
  res.redirect('/volunteer/dashboard');
}

module.exports = { isAuthenticated, isAdmin, isGuest };