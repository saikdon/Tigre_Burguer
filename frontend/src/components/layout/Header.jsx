import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWhatsApp } from '../../context/WhatsAppContext';

const Header = ({ onToggleSidebar, sidebarOpen }) => {
  const { user } = useAuth();
  const { unreadPedidos, pedidoDetectado, clearUnread } = useWhatsApp();
  const [showNotif, setShowNotif] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (pedidoDetectado) {
      setShowNotif(true);
    }
  }, [pedidoDetectado]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header
      className="position-fixed top-0 end-0 d-flex align-items-center justify-content-between px-4"
      style={{
        height: 'var(--header-height)',
        left: sidebarOpen ? 'var(--sidebar-width)' : '0',
        borderBottom: '1px solid var(--border-color)',
        zIndex: 1030,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 248, 242, 0.92)',
        transition: 'left 0.3s ease',
      }}
    >
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn"
          onClick={onToggleSidebar}
          style={{ color: 'var(--text-primary)', fontSize: '1.3rem' }}
          title={sidebarOpen ? 'Ocultar menu' : 'Mostrar menu'}
        >
          <i className={`bi ${sidebarOpen ? 'bi-layout-sidebar-inset-reverse' : 'bi-layout-sidebar-inset'}`}></i>
        </button>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="position-relative" ref={notifRef}>
          <button
            className="btn position-relative"
            onClick={() => setShowNotif(!showNotif)}
            style={{
              color: unreadPedidos > 0 ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '1.3rem',
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: unreadPedidos > 0 ? 'var(--accent-light)' : 'transparent',
              border: 'none',
              transition: 'all 0.2s'
            }}
          >
            <i className="bi bi-bell-fill"></i>
            {unreadPedidos > 0 && (
              <span
                className="position-absolute"
                style={{
                  top: '2px',
                  right: '2px',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 2px 6px rgba(255, 90, 0, 0.4)'
                }}
              >
                {unreadPedidos > 99 ? '99+' : unreadPedidos}
              </span>
            )}
          </button>

          {showNotif && pedidoDetectado && (
            <div
              className="position-absolute"
              style={{
                top: '100%',
                right: '0',
                marginTop: '8px',
                backgroundColor: '#fff',
                border: '1px solid rgba(255, 90, 0, 0.2)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                minWidth: '320px',
                maxWidth: '400px',
                zIndex: 9999,
                animation: 'slideInRight 0.3s ease'
              }}
            >
              <div
                className="d-flex align-items-center gap-3 px-4 py-3"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setShowNotif(false);
                  navigate('/whatsapp');
                  clearUnread();
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  flexShrink: 0
                }}>
                  🍔
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--accent)',
                    marginBottom: '2px'
                  }}>
                    Nuevo pedido por WhatsApp
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    <strong>{pedidoDetectado.sender_name}</strong>: {pedidoDetectado.message_text}
                  </div>
                </div>
                <i className="bi bi-chevron-right" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}></i>
              </div>
            </div>
          )}
        </div>

        <div
          className="d-none d-md-flex align-items-center gap-2 px-3 py-1 rounded-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}
        >
          <i className="bi bi-calendar3"></i>
          {dateTime.toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div
          className="d-none d-sm-flex align-items-center gap-2 px-3 py-1 rounded-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}
        >
          <i className="bi bi-clock"></i>
          {dateTime.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </header>
  );
};

export default Header;
