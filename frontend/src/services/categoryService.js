import api from './api';

const categoryService = {
  getAll: async () => {
    const { data } = await api.get('/categories');
    return data;
  },

  getActive: async () => {
    const { data } = await api.get('/categories/active');
    return data;
  },

  create: async (categoryData) => {
    const { data } = await api.post('/categories', categoryData);
    return data;
  },

  update: async (id, categoryData) => {
    const { data } = await api.put(`/categories/${id}`, categoryData);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  }
};

export default categoryService;
