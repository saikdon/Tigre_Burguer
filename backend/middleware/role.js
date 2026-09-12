const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Acceso denegado. No autenticado.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado. No tiene permisos suficientes.' });
    }

    next();
  };
};

module.exports = { authorize };
