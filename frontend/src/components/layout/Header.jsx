import { useState, useEffect } from 'react';

const Header = ({ onToggleSidebar, sidebarOpen }) => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
        className="position-fixed top-0 end-0 d-flex align-items-center justify-content-between px-3 px-md-4"
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

      <div className="d-flex align-items-center gap-2 gap-md-3">
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

    </header>
  );
};

export default Header;
