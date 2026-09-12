import { useState, useEffect } from 'react';
import saleService from '../services/saleService';
import SplitPayment from '../components/SplitPayment';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [payments, setPayments] = useState([{ payment_method: 'Efectivo', amount: 0 }]);
  const [processing, setProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const data = await saleService.getReservations();
      setReservations(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedReservation) return;
    setProcessing(true);
    try {
      await saleService.fulfillReservation(selectedReservation.id, null, payments);
      setShowPayModal(false);
      setSelectedReservation(null);
      showToast('Cobro completado');
      loadReservations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al cobrar', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async (reservation) => {
    if (!confirm('Cancelar esta reserva?')) return;
    try {
      await saleService.cancelReservation(reservation.id);
      showToast('Reserva cancelada');
      loadReservations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al cancelar', 'error');
    }
  };

  const formatCurrency = (amount) => `Bs. ${Number(amount || 0).toFixed(2)}`;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center animate-fade-in" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: 'var(--accent)' }} role="status"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 style={{ fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Reservas</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Pedidos pendientes de cobro</p>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ backgroundColor: 'rgba(245, 166, 35, 0.1)', border: '1px solid rgba(245, 166, 35, 0.2)', color: 'var(--warning)', fontWeight: 600, fontSize: '0.9rem' }}>
          <i className="bi bi-bookmark-fill"></i>
          {reservations.length} reserva{reservations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="p-5 text-center" style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-xl)', backgroundColor: 'rgba(245,166,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <i className="bi bi-bookmark" style={{ fontSize: '2rem', color: 'var(--warning)' }}></i>
          </div>
          <h5 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Sin reservas pendientes</h5>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Crea reservas desde "Nueva Orden" &gt; Reservar Pedido</p>
        </div>
      ) : (
        <div className="row g-3">
          {reservations.map((res) => (
            <div key={res.id} className="col-md-6 col-lg-4">
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ height: '4px', background: 'linear-gradient(90deg, #FF5A00, #FF8A50)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}></div>
                <div className="p-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(245,166,35,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                        <i className="bi bi-bookmark-fill"></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Reserva #{res.id}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(res.created_at).toLocaleString('es-BO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--warning)' }}>{formatCurrency(res.total)}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
                    {res.items.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center px-3 py-1.5" style={{ borderBottom: idx < res.items.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.product_name} <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span></span>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn flex-grow-1 py-2"
                      style={{ backgroundColor: 'var(--success)', color: 'white', fontWeight: 600, borderRadius: '10px', fontSize: '0.9rem' }}
                      onClick={() => { setSelectedReservation(res); setShowPayModal(true); }}
                    >
                      <i className="bi bi-cash me-1"></i>Cobrar
                    </button>
                    <button
                      className="btn py-2 px-3"
                      style={{ backgroundColor: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', color: 'var(--danger)', borderRadius: '10px', fontSize: '0.9rem' }}
                      onClick={() => handleCancel(res)}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPayModal && selectedReservation && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  <i className="bi bi-cash-stack me-2" style={{ color: 'var(--success)' }}></i>
                  Cobrar Reserva #{selectedReservation.id}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowPayModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(selectedReservation.total)}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Total a cobrar</div>
                </div>

                <SplitPayment total={Number(selectedReservation.total)} onPaymentsChange={setPayments} />
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)' }}>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPayModal(false)} style={{ borderRadius: '10px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Cancelar</button>
                <button className="btn px-4" style={{ borderRadius: '10px', backgroundColor: 'var(--success)', color: 'white', fontWeight: 600 }} onClick={handlePay} disabled={processing}>
                  {processing ? <><span className="spinner-border spinner-border-sm me-2"></span>Procesando...</> : <><i className="bi bi-check-circle me-2"></i>Confirmar Cobro</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, animation: 'slideIn 0.3s ease' }}>
          <div className="d-flex align-items-center gap-3 px-4 py-3 rounded-4" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${toastType === 'success' ? 'var(--success)' : 'var(--danger)'}`, boxShadow: `var(--shadow-md)` }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: toastType === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(229,57,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: toastType === 'success' ? 'var(--success)' : 'var(--danger)' }}>
              <i className={`bi ${toastType === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{toastMsg}</span>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
};

export default Reservations;
