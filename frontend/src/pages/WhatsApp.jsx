import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import whatsappService from '../services/whatsappService';
import { useWhatsApp } from '../context/WhatsAppContext';

const ALERT_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczIj2NysijaTstO5i+jHxCJkyYzpyTbFAsXqDJqJ+NUjV3pNK1n2U8K0qc0raiaD0sSp3RtaFoPyxKndK1oGc+LUud0rWhaD8tTJ7StaFoPy1MntO1oWg/LUye07WhaD8tTJ7StaFoPy1MntO1oWg/LUye07WhaD8tTJ7StaFoPy1MntO1oWg/LUye07WhaD8tTJ7TtaFoPy1MntO1oWg/LUye07WhaD8tTJ7TtaFoPy1MntO1oWg/LUye07WhaD8=';

const WhatsApp = () => {
  const { clearUnread, leaveWhatsAppPage } = useWhatsApp();
  const [status, setStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [userCancelled, setUserCancelled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    clearUnread();
    loadData();
    connectSocket();
    return () => {
      leaveWhatsAppPage();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectSocket = () => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('whatsapp:status', (data) => {
      setStatus(data.status);
      if (data.qr) setQrCode(data.qr);
      if (data.status === 'connected') setQrCode(null);
      if (data.status === 'waiting_qr' || data.status === 'connected') {
        setConnecting(false);
        setUserCancelled(false);
      }
    });

    socket.on('whatsapp:nuevo-mensaje', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setNewMsgCount((prev) => prev + 1);
      playAlertSound();
    });
  };

  const playAlertSound = () => {
    try {
      const audio = new Audio(ALERT_SOUND_URL);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const loadData = async () => {
    try {
      const [statusData, messagesData, groupsData] = await Promise.all([
        whatsappService.getStatus(),
        whatsappService.getMessages(100),
        whatsappService.getGroups()
      ]);
      setStatus(statusData.status);
      if (statusData.qr) setQrCode(statusData.qr);
      if (statusData.status === 'waiting_qr' || statusData.status === 'connected') {
        setConnecting(false);
        setUserCancelled(false);
      }
      setMessages(messagesData);
      setGroups(groupsData);
      if (groupsData.length > 0 && !selectedGroup) {
        setSelectedGroup(groupsData[0].remote_jid);
      }
    } catch (err) {
      console.error('Error cargando datos WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredMessages = selectedGroup
    ? messages.filter((m) => m.remote_jid === selectedGroup)
    : messages;

  const handleLogout = async () => {
    if (!confirm('Desconectar WhatsApp? Necesitare escanear el QR otra vez.')) return;
    try {
      await whatsappService.logout();
      setStatus('disconnected');
      setQrCode(null);
      setMessages([]);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleCancelReconnect = async () => {
    try {
      await whatsappService.cancelReconnect();
      setUserCancelled(true);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await whatsappService.logout();
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const { status: s, qr } = await whatsappService.getStatus();
          if (qr || s === 'connected') {
            setStatus(s);
            if (qr) setQrCode(qr);
            setConnecting(false);
            setUserCancelled(false);
            clearInterval(poll);
          }
        } catch (e) {}
        if (attempts > 20) clearInterval(poll);
      }, 2000);
    } catch (err) {
      console.error('Error:', err);
      setConnecting(false);
    }
  };

  const handleMarkAsOrder = async (msgId) => {
    try {
      await whatsappService.markAsOrder(msgId);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, is_order: true } : m))
      );
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: 'var(--accent)' }} role="status"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 style={{ fontWeight: 800, letterSpacing: '-0.5px', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            <i className="bi bi-whatsapp me-2" style={{ color: '#25D366' }}></i>
            WhatsApp
          </h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Mensajes del grupo de pedidos
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span
            className="badge d-flex align-items-center gap-1"
            style={{
              backgroundColor: status === 'connected' ? 'rgba(15, 155, 88, 0.15)' : 'rgba(229, 57, 53, 0.15)',
              color: status === 'connected' ? 'var(--success)' : 'var(--danger)',
              borderRadius: '50px',
              padding: '0.4rem 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            <i className={`bi ${status === 'connected' ? 'bi-circle-fill' : 'bi-circle'}`}></i>
            {status === 'connected' ? 'Conectado' : status === 'waiting_qr' ? 'Esperando QR' : 'Desconectado'}
          </span>
          {status === 'connected' && (
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: 'var(--danger-light)',
                border: '1px solid rgba(229, 57, 53, 0.2)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 500,
                fontSize: '0.85rem',
                padding: '0.4rem 0.8rem',
              }}
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-1"></i>Desconectar
            </button>
          )}
          {status === 'disconnected' && !userCancelled && !connecting && (
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: 'var(--warning-light)',
                border: '1px solid rgba(255, 152, 0, 0.2)',
                color: 'var(--warning)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 500,
                fontSize: '0.85rem',
                padding: '0.4rem 0.8rem',
              }}
              onClick={handleCancelReconnect}
            >
              <i className="bi bi-x-circle me-1"></i>Cancelar intento
            </button>
          )}
          {(userCancelled || connecting) && (
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: connecting ? 'rgba(13, 110, 253, 0.15)' : 'rgba(15, 155, 88, 0.15)',
                border: `1px solid ${connecting ? 'rgba(13, 110, 253, 0.2)' : 'rgba(15, 155, 88, 0.2)'}`,
                color: connecting ? 'var(--info)' : 'var(--success)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 500,
                fontSize: '0.85rem',
                padding: '0.4rem 0.8rem',
                opacity: connecting ? 0.7 : 1
              }}
              onClick={handleConnect}
              disabled={connecting}
            >
              <i className={`bi ${connecting ? 'bi-arrow-repeat spinner' : 'bi-whatsapp'} me-1`}></i>
              {connecting ? 'Conectando...' : 'Conectar'}
            </button>
          )}
        </div>
      </div>

      {status !== 'connected' && (
        <div
          className="p-4 mb-4 text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
          }}
        >
          {status === 'waiting_qr' && qrCode ? (
            <div>
              <p style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Escanea el codigo QR con tu WhatsApp
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                WhatsApp &gt; Menu &gt; Dispositivos vinculados &gt; Vincular dispositivo
              </p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}`}
                alt="QR WhatsApp"
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: '3px solid #25D366',
                  maxWidth: '250px'
                }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                El QR se actualiza cada pocos segundos
              </p>
            </div>
          ) : (
            <div>
              <i className="bi bi-whatsapp" style={{ fontSize: '3rem', color: '#25D366', display: 'block', marginBottom: '1rem', opacity: 0.3 }}></i>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>WhatsApp no esta conectado</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {connecting ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Conectando, espera un momento...</>
                ) : userCancelled ? (
                  <><i className="bi bi-hand-index-thumb me-1"></i>Presiona "Conectar" para iniciar</>
                ) : (
                  <>Reintentando conexion...</>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="row g-3" style={{ height: 'calc(100vh - 220px)' }}>
        <div className="col-lg-3 col-xl-2">
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="p-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <h6 style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>
                <i className="bi bi-chat-left-text me-2" style={{ color: 'var(--accent)' }}></i>
                Grupos
              </h6>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {groups.length === 0 ? (
                <div className="p-3 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {status === 'connected' ? 'No hay grupos con mensajes' : 'Conecta WhatsApp para ver grupos'}
                </div>
              ) : (
                groups.map((group) => (
                  <button
                    key={group.remote_jid}
                    className="w-100 text-start p-3"
                    style={{
                      backgroundColor: selectedGroup === group.remote_jid ? 'var(--accent-light)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => setSelectedGroup(group.remote_jid)}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      <i className="bi bi-people-fill me-1" style={{ color: '#25D366' }}></i>
                      Grupo
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {group.message_count} mensajes
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-9 col-xl-10">
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div
              className="p-3 d-flex align-items-center justify-content-between"
              style={{ borderBottom: '1px solid var(--border-light)' }}
            >
              <h6 style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>
                <i className="bi bi-whatsapp me-2" style={{ color: '#25D366' }}></i>
                Mensajes en tiempo real
              </h6>
              {newMsgCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '50px',
                    padding: '0.2rem 0.6rem'
                  }}
                >
                  {newMsgCount} nuevos
                </span>
              )}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                backgroundColor: '#ECE5DD',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4cdc4\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
              }}
            >
              {filteredMessages.length === 0 ? (
                <div className="text-center py-5" style={{ color: '#8696A0' }}>
                  <i className="bi bi-whatsapp" style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem', opacity: 0.3 }}></i>
                  <div style={{ fontSize: '0.95rem' }}>
                    {status === 'connected'
                      ? 'No hay mensajes aun. Espera a que alguien escriba en el grupo.'
                      : 'Conecta WhatsApp para ver los mensajes del grupo'}
                  </div>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div key={msg.id} className="d-flex mb-2" style={{ justifyContent: 'flex-start' }}>
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        maxWidth: '70%',
                        boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          color: '#027EB5',
                          marginBottom: '2px'
                        }}
                      >
                        {msg.sender_name}
                        {msg.is_order && (
                          <span
                            className="ms-1"
                            style={{
                              fontSize: '0.65rem',
                              backgroundColor: 'var(--accent)',
                              color: 'white',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              fontWeight: 600
                            }}
                          >
                            PEDIDO
                          </span>
                        )}
                      </div>
                      {msg.message_type === 'image' && msg.media_url && (
                        <img
                          src={msg.media_url}
                          alt="imagen"
                          style={{
                            maxWidth: '100%',
                            borderRadius: '6px',
                            marginBottom: '4px',
                            maxHeight: '200px',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      <div style={{ fontSize: '0.85rem', color: '#111B21', wordBreak: 'break-word' }}>
                        {msg.message_text}
                      </div>
                      <div className="d-flex align-items-center justify-content-between mt-1" style={{ gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#8696A0' }}>
                          {new Date(msg.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!msg.is_order && (
                          <button
                            className="btn p-0"
                            style={{
                              fontSize: '0.65rem',
                              color: 'var(--accent)',
                              backgroundColor: 'transparent',
                              border: 'none',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            onClick={() => handleMarkAsOrder(msg.id)}
                          >
                            <i className="bi bi-bag-check me-1"></i>Marcar pedido
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp;
