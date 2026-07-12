export const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const activeRole = req.headers?.['x-simulated-role'] || req.user?.role;

    if (!activeRole) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    if (!allowedRoles.includes(activeRole)) {
      return res.status(403).json({ error: `Forbidden. Required role: ${allowedRoles.join(' or ')}` });
    }

    next();
  };
};
