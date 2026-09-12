import api from './api';

const productService = {
  getAll: async () => {
    const { data } = await api.get('/products');
    return data;
  },

  getActive: async () => {
    const { data } = await api.get('/products/active');
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  getByCategory: async (categoryId) => {
    const { data } = await api.get(`/products/category/${categoryId}`);
    return data;
  },

  create: async (productData, imageFile) => {
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined && productData[key] !== '') {
        formData.append(key, productData[key]);
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }
    const { data } = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  update: async (id, productData, imageFile) => {
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }
    const { data } = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  getTopSelling: async () => {
    const { data } = await api.get('/products/top-selling');
    return data;
  },

  toggleTopSelling: async (id) => {
    const { data } = await api.put(`/products/${id}/top-selling`);
    return data;
  }
};

export default productService;
