import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { TigreLogo, ClawMarks } from '../TigreBranding';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const { unreadPedidos } = useWhatsApp();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
    { path: '/nueva-orden', label: 'Nueva Orden', icon: 'bi-bag-plus-fill' },
    { path: '/mesas', label: 'Mesas', icon: 'bi-grid-3x3-gap-fill' },
    { path: '/caja', label: 'Caja', icon: 'bi-cash-stack' },
    { path: '/reservas', label: 'Reservas', icon: 'bi-bookmark-fill' },
    { path: '/reportes', label: 'Reportes', icon: 'bi-bar-chart-line-fill' },
    { path: '/whatsapp', label: 'WhatsApp', icon: 'bi-whatsapp' },
  ];

  const adminItems = [
    { path: '/productos', label: 'Productos', icon: 'bi-box-seam-fill' },
    { path: '/categorias', label: 'Categorías', icon: 'bi-tags-fill' },
  ];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={() => {
        if (window.innerWidth <= 768) onClose();
      }}
      className={({ isActive }) =>
        `d-flex align-items-center gap-3 py-2.5 px-3 mb-1 text-decoration-none position-relative`
      }
      style={({ isActive }) => ({
        color: isActive ? '#fff' : 'var(--text-secondary)',
        backgroundColor: isActive ? 'var(--accent)' : 'transparent',
        borderRadius: 'var(--radius-md)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        fontSize: '0.9rem',
        fontWeight: isActive ? 600 : 500,
        boxShadow: isActive ? '0 4px 12px rgba(255, 90, 0, 0.3)' : 'none',
        transform: isActive ? 'scale(1.01)' : 'scale(1)',
      })}
    >
      {({ isActive }) => (
        <>
          <div style={{ position: 'relative' }}>
            <i
              className={`bi ${item.icon}`}
              style={{
                fontSize: '1.15rem',
                width: '24px',
                textAlign: 'center',
                opacity: isActive ? 1 : 0.7,
              }}
            ></i>
            {item.path === '/whatsapp' && unreadPedidos > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  backgroundColor: '#E53935',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  borderRadius: '50px',
                  padding: '1px 5px',
                  minWidth: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  boxShadow: '0 2px 6px rgba(229, 57, 53, 0.4)',
                  animation: 'pulse 1.5s infinite',
                }}
              >
                {unreadPedidos > 9 ? '9+' : unreadPedidos}
              </span>
            )}
          </div>
          {item.label}
          {isActive && (
            <div
              style={{
                position: 'absolute',
                left: '-12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '20px',
                borderRadius: '0 4px 4px 0',
                backgroundColor: '#fff',
              }}
            />
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      {isOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1040, backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className="position-fixed top-0 start-0 h-100 d-flex flex-column"
        style={{
          width: '270px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          zIndex: 1050,
          boxShadow: isOpen ? '4px 0 24px rgba(0, 0, 0, 0.04)' : 'none',
          transform: isOpen ? 'translateX(0)' : 'translateX(-270px)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {/* Brand Header */}
        <div className="px-4 pt-4 pb-3 d-flex align-items-center justify-content-between position-relative" style={{ borderBottom: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <ClawMarks style={{ top: '-20px', right: '-10px', width: '80px', height: '100px', opacity: 0.06 }} />
          <TigreLogo size={46} variant="full" />
          <button
            className="btn p-1"
            onClick={onClose}
            style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1 }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 px-3 py-3" style={{ overflowY: 'auto' }}>
          <div
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              paddingLeft: '0.75rem',
              fontWeight: 600,
            }}
          >
            Principal
          </div>
          {menuItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}

          {isAdmin && (
            <>
              <div
                style={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--text-muted)',
                  marginTop: '1.25rem',
                  marginBottom: '0.5rem',
                  paddingLeft: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Administración
              </div>
              {adminItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </>
          )}
        </nav>

        {/* User Profile & Logout */}
        <div className="px-3 pb-4 pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
          <div className="d-flex align-items-center gap-3 px-2 mb-3">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #FF5A00, #FF7A00)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(255, 90, 0, 0.2)',
              }}
            >
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'var(--text-primary)',
                }}
              >
                {user?.full_name}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  textTransform: 'capitalize',
                  fontWeight: 500,
                }}
              >
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.55rem',
              fontWeight: 500,
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--danger-light)';
              e.currentTarget.style.borderColor = 'rgba(229, 57, 53, 0.2)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-input)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <i className="bi bi-box-arrow-left"></i>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
