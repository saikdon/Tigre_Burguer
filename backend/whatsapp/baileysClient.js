const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require('baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const { handleMessage } = require('./messageHandler');
const NodeCache = require('node-cache');

const SESSION_DIR = path.join(__dirname, '../whatsapp-session');
const logger = pino({ level: 'warn' });
const msgRetryCounterCache = new NodeCache({ stdTTL: 300 });

let sock = null;
let io = null;
let connectionStatus = 'disconnected';
let qrCode = null;
let reconnectTimer = null;
let retryCount = 0;
let consecutiveFailures = 0;

const getSock = () => sock;
const getConnectionStatus = () => connectionStatus;
const getQrCode = () => qrCode;

const initWhatsApp = async (socketIo) => {
  io = socketIo;
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
  await connectToWhatsApp();
};

const connectToWhatsApp = async () => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    let version;
    try {
      const fetched = await fetchLatestBaileysVersion();
      version = fetched.version;
      console.log(`Version Baileys: ${version.join('.')}`);
    } catch (verr) {
      version = [6, 7, 8];
    }

    const hasSession = !!state.creds?.registered;
    if (hasSession) {
      retryCount = 0;
    }

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      logger,
      printQRInTerminal: false,
      browser: ['Tigre Burger POS', 'Chrome', '4.0.0'],
      generateHighQualityLinkPreview: false,
      msgRetryCounterCache,
      defaultQueryTimeoutMs: 120000,
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCode = qr;
        connectionStatus = 'waiting_qr';
        io.emit('whatsapp:status', { status: 'waiting_qr', qr });
        console.log('QR generado - escanea con tu celular');
      }

      if (connection === 'open') {
        connectionStatus = 'connected';
        qrCode = null;
        retryCount = 0;
        consecutiveFailures = 0;
        console.log('WhatsApp CONECTADO!');
        io.emit('whatsapp:status', { status: 'connected' });
      }

      if (connection === 'close') {
        if (reconnectTimer) clearTimeout(reconnectTimer);

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        consecutiveFailures++;
        retryCount++;

        console.log(`Conexion cerrada. Status: ${statusCode}. Fallo #${consecutiveFailures}`);

        const isRealLogout = statusCode === DisconnectReason.loggedOut && consecutiveFailures > 5;

        if (isRealLogout) {
          connectionStatus = 'disconnected';
          qrCode = null;
          io.emit('whatsapp:status', { status: 'disconnected' });
          console.log('Sesion expirada definitivamente. Generando nuevo QR...');
          if (fs.existsSync(SESSION_DIR)) {
            try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }); } catch (e) {}
          }
          consecutiveFailures = 0;
          retryCount = 0;
          setTimeout(() => connectToWhatsApp(), 2000);
          return;
        }

        connectionStatus = 'disconnected';
        io.emit('whatsapp:status', { status: 'disconnected' });

        // 440 = connectionReplaced: WhatsApp dice que otra sesion entro
        // Esperar 60s para no saturar y que WhatsApp acepte la reconexion
        let delay;
        if (statusCode === DisconnectReason.connectionReplaced) {
          delay = 15000;
          console.log('Sesion reemplazada (440). Reconectando en 15s...');
        } else {
          delay = Math.min(3000 * Math.pow(1.3, retryCount - 1), 20000);
          console.log(`Reconectando en ${(delay/1000).toFixed(1)}s... (intento ${retryCount})`);
        }

        reconnectTimer = setTimeout(() => {
          connectToWhatsApp();
        }, delay);
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (msg.key.fromMe) continue;
        await handleMessage(sock, msg, io);
      }
    });

  } catch (err) {
    console.error('Error conectando WhatsApp:', err.message);
    connectionStatus = 'disconnected';
    io.emit('whatsapp:status', { status: 'disconnected' });

    consecutiveFailures++;
    retryCount++;
    const delay = Math.min(3000 * Math.pow(1.3, retryCount - 1), 20000);
    reconnectTimer = setTimeout(() => {
      connectToWhatsApp();
    }, delay);
  }
};

const sendWhatsAppMessage = async (jid, text) => {
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp no esta conectado');
  }
  return sock.sendMessage(jid, { text });
};

const getChats = async () => {
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp no esta conectado');
  }
  return sock.store.chats.all();
};

const logout = async () => {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (sock) {
    try { sock.end(undefined); } catch (e) {}
    sock = null;
  }
  connectionStatus = 'disconnected';
  qrCode = null;
  retryCount = 0;
  consecutiveFailures = 0;
  if (fs.existsSync(SESSION_DIR)) {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  }
  if (io) {
    io.emit('whatsapp:status', { status: 'disconnected' });
  }
  console.log('Sesion eliminada. Iniciando nueva conexion para QR...');
  await connectToWhatsApp();
};

const cancelReconnect = () => {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (sock) {
    try { sock.end(undefined); } catch (e) {}
    sock = null;
  }
  connectionStatus = 'disconnected';
  qrCode = null;
  retryCount = 0;
  consecutiveFailures = 0;
  if (io) {
    io.emit('whatsapp:status', { status: 'disconnected' });
  }
  console.log('Reconexion cancelada por el usuario.');
};

module.exports = {
  initWhatsApp,
  getSock,
  getConnectionStatus,
  getQrCode,
  sendWhatsAppMessage,
  getChats,
  logout,
  cancelReconnect
};
