const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: You do not have the required permissions for this action' 
      });
    }
    next();
  };
};

module.exports = requireRole;