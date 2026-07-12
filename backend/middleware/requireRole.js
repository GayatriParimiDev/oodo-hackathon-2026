module.exports = (allowedRoles) => {
  // Normalize allowedRoles to an array if it's a single string
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. User not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to access this resource.' });
    }

    next();
  };
};
