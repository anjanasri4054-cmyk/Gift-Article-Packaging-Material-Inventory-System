const authMiddleware = (req, res, next) => {
  // Authentication completely bypassed: Admin directly logged in
  req.user = { id: 1, name: 'Admin', email: 'admin@paperplane.com' };
  next();
};

module.exports = authMiddleware;
