import axios from 'axios';

// In Render the frontend and API share an origin. If the catalog is hosted separately
// (for example Vercel), set VITE_API_BASE_URL to the backend origin without /api.
const backendOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const publicApi = axios.create({
  baseURL: `${backendOrigin}/api/public`,
  headers: { 'Content-Type': 'application/json' }
});

const publicCatalogService = {
  getCatalog: async () => (await publicApi.get('/catalog')).data,
  createReservation: async (payload) => (await publicApi.post('/reservations', payload)).data
};

export default publicCatalogService;
