import api from './api';

const saleService = {
  createTakeaway: async (items, payments) => {
    const { data } = await api.post('/sales/takeaway', { items, payments });
    return data;
  },

  openMesa: async (mesaId, items) => {
    const { data } = await api.post('/sales/mesa', { mesa_id: mesaId, items });
    return data;
  },

  addToMesaSale: async (saleId, items) => {
    const { data } = await api.post(`/sales/${saleId}/items`, { items });
    return data;
  },

  updateItemQuantity: async (itemId, quantity) => {
    const { data } = await api.put(`/sales/items/${itemId}/quantity`, { quantity });
    return data;
  },

  removeItem: async (itemId) => {
    const { data } = await api.delete(`/sales/items/${itemId}`);
    return data;
  },

  closeMesaSale: async (saleId, paymentMethod, payments) => {
    const payload = payments && payments.length > 0
      ? { payments }
      : { payment_method: paymentMethod };
    const { data } = await api.post(`/sales/${saleId}/close`, payload);
    return data;
  },

  getActiveByMesa: async (mesaId) => {
    const { data } = await api.get(`/sales/mesa/${mesaId}/active`);
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/sales/${id}`);
    return data;
  },

  getTodayStats: async () => {
    const { data } = await api.get('/sales/today-stats');
    return data;
  },

  createReservation: async (items, notes) => {
    const { data } = await api.post('/sales/reservation', { items, notes });
    return data;
  },

  fulfillReservation: async (saleId, paymentMethod, payments) => {
    const payload = payments && payments.length > 0
      ? { payments }
      : { payment_method: paymentMethod };
    const { data } = await api.post(`/sales/reservation/${saleId}/fulfill`, payload);
    return data;
  },

  cancelReservation: async (saleId) => {
    const { data } = await api.post(`/sales/reservation/${saleId}/cancel`);
    return data;
  },

  getReservations: async () => {
    const { data } = await api.get('/sales/reservations');
    return data;
  }
};

export default saleService;
