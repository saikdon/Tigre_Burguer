import api from './api';

const cashRegisterService = {
  getOpen: async () => {
    const { data } = await api.get('/cash-register/open');
    return data;
  },

  open: async (openingAmount) => {
    const { data } = await api.post('/cash-register/open', { opening_amount: openingAmount });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/cash-register/${id}`);
    return data;
  },

  close: async (id, closingAmount) => {
    const { data } = await api.post(`/cash-register/${id}/close`, { closing_amount: closingAmount });
    return data;
  },

  getSales: async (id) => {
    const { data } = await api.get(`/cash-register/${id}/sales`);
    return data;
  },

  getSummary: async (id) => {
    const { data } = await api.get(`/cash-register/${id}/summary`);
    return data;
  },

  getSalesDetails: async (id) => {
    const { data } = await api.get(`/cash-register/${id}/sales-details`);
    return data;
  },

  getClosingSummary: async (id) => {
    const { data } = await api.get(`/cash-register/${id}/closing-summary`);
    return data;
  },

  getTodaySummary: async () => {
    const { data } = await api.get('/cash-register/today');
    return data;
  }
};

export default cashRegisterService;
