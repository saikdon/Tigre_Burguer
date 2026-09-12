import api from './api';

const tableService = {
  getAll: async () => {
    const { data } = await api.get('/tables');
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/tables/${id}`);
    return data;
  },

  updateStatus: async (id, status) => {
    const { data } = await api.put(`/tables/${id}/status`, { status });
    return data;
  },

  getStatusCounts: async () => {
    const { data } = await api.get('/tables/status-counts');
    return data;
  }
};

export default tableService;
