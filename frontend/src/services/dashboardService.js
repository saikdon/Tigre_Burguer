import api from './api';

const dashboardService = {
  getSummary: async () => {
    const { data } = await api.get('/dashboard');
    return data;
  }
};

export default dashboardService;
