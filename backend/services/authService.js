const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const userRepository = require('../repositories/userRepository');

class AuthService {
  async login(username, password) {
    console.log(`[LOGIN] Intento de login: usuario="${username}"`);
    const user = await userRepository.findByUsername(username);

    if (!user) {
      console.log(`[LOGIN] Usuario "${username}" no encontrado en BD`);
      throw Object.assign(new Error('Credenciales incorrectas'), { status: 401 });
    }

    console.log(`[LOGIN] Usuario encontrado: id=${user.id}, status=${user.status}, role=${user.role_name}`);

    if (user.status !== 'activo') {
      throw Object.assign(new Error('Usuario desactivado'), { status: 403 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log(`[LOGIN] Password valid: ${validPassword}`);
    if (!validPassword) {
      console.log(`[LOGIN] Contraseña incorrecta para usuario "${username}"`);
      throw Object.assign(new Error('Credenciales incorrectas'), { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role_name, full_name: user.full_name },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role_name
      }
    };
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    }
    return user;
  }

  async createUser(userData) {
    const existing = await userRepository.findByUsername(userData.username);
    if (existing) {
      throw Object.assign(new Error('El nombre de usuario ya existe'), { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return userRepository.create({ ...userData, password: hashedPassword });
  }

  async updateUser(id, userData) {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    return userRepository.update(id, userData);
  }

  async getAllUsers() {
    return userRepository.findAll();
  }

  async deleteUser(id) {
    return userRepository.delete(id);
  }
}

module.exports = new AuthService();
