import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tableService from '../services/tableService';

const Tables = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const data = await tableService.getAll();
      setTables(data);
    } catch (err) {
      console.error('Error al cargar mesas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (table) => {
    navigate(`/mesa/${table.id}`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'libre': return 'bi-shop';
      case 'ocupada': return 'bi-people-fill';
      case 'pendiente_pago': return 'bi-credit-card';
      default: return 'bi-shop';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'libre': return 'Disponible';
      case 'ocupada': return 'Ocupada';
      case 'pendiente_pago': return 'Pend. Pago';
      default: return status;
    }
  };

  const getActionLabel = (status) => {
    switch (status) {
      case 'libre': return 'Abrir orden';
      case 'ocupada': return 'Ver orden';
      case 'pendiente_pago': return 'Cobrar';
      default: return 'Ver';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: 'var(--accent)' }} role="status"></div>
      </div>
    );
  }

  const libre = tables.filter(t => t.status === 'libre').length;
  const ocupada = tables.filter(t => t.status === 'ocupada').length;
  const pendiente = tables.filter(t => t.status === 'pendiente_pago').length;

  return (
    <div className="animate-fade-in">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 style={{ fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Mesas</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Gestión y estado de mesas del restaurante</p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col">
          <div
            className="d-flex align-items-center gap-3 px-4 py-3 rounded-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                color: 'var(--success)',
                fontSize: '1.1rem'
              }}
            >
              <i className="bi bi-shop"></i>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>{libre}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Libres</div>
            </div>
          </div>
        </div>
        <div className="col">
          <div
            className="d-flex align-items-center gap-3 px-4 py-3 rounded-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(229, 57, 53, 0.1)',
                color: 'var(--danger)',
                fontSize: '1.1rem'
              }}
            >
              <i className="bi bi-people-fill"></i>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)', lineHeight: 1 }}>{ocupada}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ocupadas</div>
            </div>
          </div>
        </div>
        <div className="col">
          <div
            className="d-flex align-items-center gap-3 px-4 py-3 rounded-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: 'var(--warning)',
                fontSize: '1.1rem'
              }}
            >
              <i className="bi bi-credit-card"></i>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)', lineHeight: 1 }}>{pendiente}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Pend. Pago</div>
            </div>
          </div>
        </div>
        <div className="col">
          <div
            className="d-flex align-items-center gap-3 px-4 py-3 rounded-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 90, 0, 0.1)',
                color: 'var(--accent)',
                fontSize: '1.1rem'
              }}
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{tables.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mesa-floor-grid">
        {tables.map((table) => {
          const gridArea = table.number === 5 ? 'top'
            : table.number === 3 ? 'leftM'
            : table.number === 4 ? 'rightM'
            : table.number === 1 ? 'leftB'
            : 'rightB';

          const justifySelf = 'stretch';
          const maxWidth = '100%';

          return (
            <div key={table.id} style={{ gridArea, justifySelf, maxWidth }}>
              <div
                className={`mesa-card ${table.status}`}
                onClick={() => handleTableClick(table)}
              >
                <div className={`mesa-status-bar ${table.status}`}></div>

                <div className="p-4 pb-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className={`mesa-icon ${table.status}`}>
                      <i className={`bi ${getStatusIcon(table.status)}`}></i>
                    </div>
                    <span className={`mesa-status-badge ${table.status}`}>
                      <span className={`mesa-status-dot ${table.status}`}></span>
                      {getStatusLabel(table.status)}
                    </span>
                  </div>

                  <div className="mesa-number" style={{ color: 'var(--text-primary)' }}>
                    Mesa {table.number}
                  </div>
                </div>

                <div className="mesa-action-hint d-flex align-items-center justify-content-center gap-2">
                  <i className="bi bi-arrow-right-circle" style={{ fontSize: '0.9rem' }}></i>
                  {getActionLabel(table.status)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .mesa-floor-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto auto;
          grid-template-areas:
          "top    top"
          "leftM  rightM"
          "leftB  rightB";
          gap: 1.5rem;
          max-width: 960px;
          margin: 0 auto;
          padding: 1.5rem 0;
        }

        @media (max-width: 640px) {
          .mesa-floor-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto auto auto;
            grid-template-areas:
              "top"
              "leftM"
              "rightM"
              "leftB"
              "rightB";
            gap: 1rem;
            padding: 1rem 0;
          }
          .mesa-floor-grid > div {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Tables;
