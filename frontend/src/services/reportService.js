import api from './api';

const reportService = {
  getDailyReport: async (date) => {
    const { data } = await api.get('/reports/daily', { params: { date } });
    return data;
  },

  getTopProducts: async (date, limit = 10) => {
    const { data } = await api.get('/reports/top-products', { params: { date, limit } });
    return data;
  },

  getPeriodReport: async (startDate, endDate) => {
    const { data } = await api.get('/reports/period', { params: { start_date: startDate, end_date: endDate } });
    return data;
  }
};

export default reportService;
