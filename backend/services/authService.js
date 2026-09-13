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
    const current = await userRepository.findById(id);
    if (!current) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    if (userData.username && userData.username !== current.username) {
      const duplicate = await userRepository.findByUsername(userData.username);
      if (duplicate) throw Object.assign(new Error('El nombre de usuario ya existe'), { status: 409 });
    }
    const roles = await userRepository.findRoles();
    const nextRole = roles.find((role) => role.id === Number(userData.role_id))?.name || current.role_name;
    const nextStatus = userData.status || current.status;
    if (current.role_name === 'admin' && (nextRole !== 'admin' || nextStatus !== 'activo')) {
      if (await userRepository.countActiveAdmins(id) === 0) {
        throw Object.assign(new Error('Debe permanecer al menos un administrador activo'), { status: 409 });
      }
    }
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    } else {
      delete userData.password;
    }
    return userRepository.update(id, userData);
  }

  async getAllUsers() {
    return userRepository.findAll();
  }

  async getRoles() { return userRepository.findRoles(); }

  async deleteUser(id) {
    return userRepository.delete(id);
  }
}

module.exports = new AuthService();
