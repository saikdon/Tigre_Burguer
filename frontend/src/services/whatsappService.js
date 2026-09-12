import api from './api';

const whatsappService = {
  getStatus: async () => {
    const { data } = await api.get('/whatsapp/status');
    return data;
  },

  getMessages: async (limit = 50, before = null) => {
    const params = { limit };
    if (before) params.before = before;
    const { data } = await api.get('/whatsapp/messages', { params });
    return data;
  },

  getMessagesByGroup: async (jid, limit = 50) => {
    const { data } = await api.get(`/whatsapp/messages/group/${jid}`, { params: { limit } });
    return data;
  },

  getGroups: async () => {
    const { data } = await api.get('/whatsapp/groups');
    return data;
  },

  markAsOrder: async (id) => {
    const { data } = await api.put(`/whatsapp/messages/${id}/order`);
    return data;
  },

  logout: async () => {
    const { data } = await api.post('/whatsapp/logout');
    return data;
  },

  cancelReconnect: async () => {
    const { data } = await api.post('/whatsapp/cancel');
    return data;
  }
};

export default whatsappService;
