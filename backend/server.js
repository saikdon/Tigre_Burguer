const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/env');
const { testConnection } = require('./config/database');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Rechazo no manejado:', reason?.message || reason);
});

const startServer = async () => {
  const connected = await testConnection();
  if (!connected) {
    console.error('No se pudo conectar a MySQL. Verifique la configuracion.');
    process.exit(1);
  }

  global.io = io;

  io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  server.listen(config.port, config.host, () => {
    console.log('═══════════════════════════════════════════');
    console.log(`  Servidor corriendo en puerto ${config.port}`);
    console.log(`  Local:    http://localhost:${config.port}`);
    console.log(`  Red:      http://${config.localIP}:${config.port}`);
    console.log(`  API:      http://localhost:${config.port}/api`);
    console.log('═══════════════════════════════════════════');
  });

  try {
    const { initWhatsApp } = require('./whatsapp/baileysClient');
    await initWhatsApp(io);
  } catch (err) {
    console.error('Error iniciando WhatsApp (el servidor sigue funcionando):', err.message);
  }
};

startServer();
