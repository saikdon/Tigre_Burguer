const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const tableRoutes = require('./routes/tableRoutes');
const cashRegisterRoutes = require('./routes/cashRegisterRoutes');
const saleRoutes = require('./routes/saleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const whatsappRoutes = require('./whatsapp/whatsappRoutes');

const path = require('path');

const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/cash-register', cashRegisterRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tiger Burger POS API funcionando' });
});

if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use(errorHandler);

module.exports = app;
