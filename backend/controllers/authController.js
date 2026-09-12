const authService = require('../services/authService');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await authService.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const id = await authService.createUser(req.body);
    res.status(201).json({ id, message: 'Usuario creado correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    await authService.updateUser(req.params.id, req.body);
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await authService.deleteUser(req.params.id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
