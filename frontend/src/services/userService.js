import api from './api';

export default {
  async getAll() { return (await api.get('/auth/users')).data; },
  async getRoles() { return (await api.get('/auth/roles')).data; },
  async create(data) { return (await api.post('/auth/users', data)).data; },
  async update(id, data) { return (await api.put(`/auth/users/${id}`, data)).data; },
};
