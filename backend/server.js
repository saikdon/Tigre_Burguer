const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { testConnection } = require('./config/database');
const { ensureReservationSchema } = require('./services/reservationSchemaService');

const server = http.createServer(app);


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

  await ensureReservationSchema();

  server.listen(config.port, config.host, () => {
    console.log('═══════════════════════════════════════════');
    console.log(`  Servidor corriendo en puerto ${config.port}`);
    console.log(`  Local:    http://localhost:${config.port}`);
    console.log(`  Red:      http://${config.localIP}:${config.port}`);
    console.log(`  API:      http://localhost:${config.port}/api`);
    console.log('═══════════════════════════════════════════');
  });

};

startServer();
