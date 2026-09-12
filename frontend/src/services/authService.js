import api from './api';

const authService = {
  login: async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get('/auth/profile');
    return data;
  },

  getUsers: async () => {
    const { data } = await api.get('/auth/users');
    return data;
  },

  createUser: async (userData) => {
    const { data } = await api.post('/auth/users', userData);
    return data;
  },

  updateUser: async (id, userData) => {
    const { data } = await api.put(`/auth/users/${id}`, userData);
    return data;
  },

  deleteUser: async (id) => {
    const { data } = await api.delete(`/auth/users/${id}`);
    return data;
  }
};

export default authService;
