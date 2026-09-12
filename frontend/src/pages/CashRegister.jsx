import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import cashRegisterService from '../services/cashRegisterService';

const CashRegister = () => {
  const { user } = useAuth();
  const [openRegister, setOpenRegister] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showClosingSummary, setShowClosingSummary] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [closingSummary, setClosingSummary] = useState(null);
  const [closingSummaryLoading, setClosingSummaryLoading] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [todaySummary, setTodaySummary] = useState(null);
  const openingInputRef = useRef(null);
  const closingInputRef = useRef(null);

  useEffect(() => {
    if (showOpenModal && openingInputRef.current) {
      setTimeout(() => openingInputRef.current?.focus(), 100);
    }
  }, [showOpenModal]);

  useEffect(() => {
    if (showCloseModal && closingInputRef.current) {
      setTimeout(() => closingInputRef.current?.focus(), 100);
    }
  }, [showCloseModal]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [register, summary] = await Promise.all([
        cashRegisterService.getOpen(),
        cashRegisterService.getTodaySummary()
      ]);
      setOpenRegister(register);
      setTodaySummary(summary);

      if (register) {
        const salesData = await cashRegisterService.getSales(register.id);
        setSales(salesData);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    if (!openingAmount || Number(openingAmount) < 0) {
      alert('Ingrese un monto valido');
      return;
    }
    setProcessing(true);
    try {
      await cashRegisterService.open(Number(openingAmount));
      setShowOpenModal(false);
      setOpeningAmount('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al abrir caja');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = async () => {
    if (!closingAmount || Number(closingAmount) < 0) {
      alert('Ingrese el monto de cierre');
      return;
    }
    setProcessing(true);
    try {
      await cashRegisterService.close(openRegister.id, Number(closingAmount));
      setShowCloseModal(false);
      setClosingAmount('');
      setShowClosingSummary(false);
      setClosingSummary(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cerrar caja');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetail = async (sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const details = await cashRegisterService.getSalesDetails(openRegister.id);
      const fullSale = details.find(s => s.id === sale.id);
      if (fullSale) setSelectedSale(fullSale);
    } catch (err) {
      console.error('Error loading details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenClosingSummary = async () => {
    if (!openRegister) return;
    setClosingSummaryLoading(true);
    setShowClosingSummary(true);
    try {
      const summary = await cashRegisterService.getClosingSummary(openRegister.id);
      setClosingSummary(summary);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setClosingSummaryLoading(false);
    }
  };

  const formatCurrency = (amount) => `Bs. ${Number(amount || 0).toFixed(2)}`;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: 'var(--accent)' }} role="status"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 style={{ fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Caja</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Gestión de caja del día</p>
        </div>
        {!openRegister ? (
          <button className="btn btn-accent" onClick={() => setShowOpenModal(true)}>
            <i className="bi bi-lock-open me-2"></i>Abrir Caja
          </button>
        ) : (
          <button
            className="btn"
            style={{ backgroundColor: 'var(--danger)', color: 'white', fontWeight: 600 }}
            onClick={handleOpenClosingSummary}
          >
            <i className="bi bi-lock me-2"></i>Cerrar Caja
          </button>
        )}
      </div>

      {openRegister && (
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon mb-2" style={{ backgroundColor: 'rgba(255, 90, 0, 0.1)', color: 'var(--accent)' }}>
                <i className="bi bi-cash-stack"></i>
              </div>
              <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>
                {formatCurrency(openRegister.opening_amount)}
              </div>
              <div className="stat-label">Monto Inicial</div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon mb-2" style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: 'var(--success)' }}>
                <i className="bi bi-cash"></i>
              </div>
              <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--success)' }}>
                {formatCurrency(openRegister.cash_sales)}
              </div>
              <div className="stat-label">Ventas Efectivo</div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon mb-2" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}>
                <i className="bi bi-qr-code"></i>
              </div>
              <div className="stat-value" style={{ fontSize: '1.4rem', color: '#3498db' }}>
                {formatCurrency(openRegister.qr_sales)}
              </div>
              <div className="stat-label">Ventas QR</div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon mb-2" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                <i className="bi bi-receipt"></i>
              </div>
              <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--warning)' }}>
                {openRegister.order_count || 0}
              </div>
              <div className="stat-label">Pedidos</div>
            </div>
          </div>
        </div>
      )}

      {openRegister && (
        <div className="card mb-4">
          <div className="p-3 d-flex align-items-center justify-content-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              <i className="bi bi-list-ul me-2" style={{ color: 'var(--accent)' }}></i>
              Ventas de la Caja
            </h6>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {sales.length} venta{sales.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-dark-custom mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tipo</th>
                  <th>Mesa</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Hora</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                      Sin ventas registradas
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: 600 }}>{sale.id}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: sale.sale_type === 'llevar' ? 'rgba(255, 90, 0, 0.1)' : 'rgba(52, 152, 219, 0.1)',
                            color: sale.sale_type === 'llevar' ? 'var(--accent)' : '#3498db',
                            borderRadius: '8px'
                          }}
                        >
                          {sale.sale_type === 'llevar' ? 'Para Llevar' : 'Mesa'}
                        </span>
                      </td>
                      <td>{sale.mesa_number ? `Mesa ${sale.mesa_number}` : '-'}</td>
                      <td>{sale.payment_method_name}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(sale.total)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {new Date(sale.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{
                            backgroundColor: 'rgba(255, 90, 0, 0.08)',
                            color: 'var(--accent)',
                            border: '1px solid rgba(255, 90, 0, 0.2)',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.6rem'
                          }}
                          onClick={() => handleViewDetail(sale)}
                        >
                          <i className="bi bi-eye me-1"></i>Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!openRegister && todaySummary && Number(todaySummary.total_registers) > 0 && (
        <div className="card p-4">
          <h6 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            <i className="bi bi-calendar-check me-2" style={{ color: 'var(--accent)' }}></i>
            Resumen del Día
          </h6>
          <div className="row g-3">
            <div className="col-sm-4">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Vendido</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{formatCurrency(todaySummary.total_revenue)}</div>
            </div>
            <div className="col-sm-4">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Efectivo</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{formatCurrency(todaySummary.total_cash)}</div>
            </div>
            <div className="col-sm-4">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>QR</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{formatCurrency(todaySummary.total_qr)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DETALLE VENTA ===== */}
      {showDetailModal && selectedSale && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '1rem 1.25rem' }}>
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  <i className="bi bi-receipt me-2" style={{ color: 'var(--accent)' }}></i>
                  Detalle Venta #{selectedSale.id}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowDetailModal(false); setSelectedSale(null); }}></button>
              </div>
              <div className="modal-body" style={{ padding: '1.25rem' }}>
                <div className="p-3 mb-3" style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tipo</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {selectedSale.sale_type === 'llevar' ? 'Para Llevar' : `Mesa ${selectedSale.mesa_number}`}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pago</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {selectedSale.payments && selectedSale.payments.length > 0
                        ? selectedSale.payments.map(p => `${p.payment_method_name} Bs.${Number(p.amount).toFixed(2)}`).join(' + ')
                        : selectedSale.payment_method_name
                      }
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hora</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {new Date(selectedSale.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {detailLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" style={{ color: 'var(--accent)' }}></div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Productos
                    </div>
                    {selectedSale.items && selectedSale.items.length > 0 ? (
                      <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        {selectedSale.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="d-flex justify-content-between align-items-center px-3 py-2"
                            style={{ borderBottom: idx < selectedSale.items.length - 1 ? '1px solid var(--border-light)' : 'none' }}
                          >
                            <div>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.product_name}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '6px' }}>
                                x{item.quantity} @ {formatCurrency(item.unit_price)}
                              </span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Sin productos</p>
                    )}
                    <div className="d-flex justify-content-between mt-3 px-1">
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent)' }}>{formatCurrency(selectedSale.total)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)', padding: '1rem 1.25rem' }}>
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowDetailModal(false); setSelectedSale(null); }} style={{ borderRadius: '10px' }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL RESUMEN CIERRE ===== */}
      {showClosingSummary && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '1rem 1.25rem' }}>
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  <i className="bi bi-clipboard-data me-2" style={{ color: 'var(--warning)' }}></i>
                  Resumen del Turno
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowClosingSummary(false); setClosingSummary(null); }}></button>
              </div>
              <div className="modal-body" style={{ padding: '1.25rem' }}>
                {closingSummaryLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm" style={{ color: 'var(--accent)' }}></div>
                  </div>
                ) : closingSummary ? (
                  <>
                    <div className="row g-3 mb-4">
                      <div className="col-sm-3">
                        <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-input)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto Inicial</div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>{formatCurrency(closingSummary.register?.opening_amount)}</div>
                        </div>
                      </div>
                      <div className="col-sm-3">
                        <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-input)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Ventas</div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--success)' }}>{formatCurrency(closingSummary.register?.total_sales)}</div>
                        </div>
                      </div>
                      <div className="col-sm-3">
                        <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-input)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Efectivo</div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{formatCurrency(closingSummary.register?.cash_sales)}</div>
                        </div>
                      </div>
                      <div className="col-sm-3">
                        <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-input)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>QR</div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{formatCurrency(closingSummary.register?.qr_sales)}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <i className="bi bi-bag-check me-1"></i> Productos Vendidos
                    </div>
                    {closingSummary.product_summary && closingSummary.product_summary.length > 0 ? (
                      <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem' }}>
                        {closingSummary.product_summary.map((prod, idx) => (
                          <div
                            key={idx}
                            className="d-flex justify-content-between align-items-center px-3 py-2"
                            style={{ borderBottom: idx < closingSummary.product_summary.length - 1 ? '1px solid var(--border-light)' : 'none' }}
                          >
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{prod.product_name}</span>
                            <div className="d-flex align-items-center gap-3">
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>x{prod.total_quantity}</span>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{formatCurrency(prod.total_revenue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 1rem' }}>Sin ventas en este turno</p>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <i className="bi bi-list-ul me-1"></i> Ventas ({closingSummary.sales?.length || 0})
                    </div>
                    {closingSummary.sales && closingSummary.sales.length > 0 && (
                      <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        {closingSummary.sales.map((sale, idx) => (
                          <div
                            key={sale.id}
                            className="d-flex justify-content-between align-items-center px-3 py-2"
                            style={{ borderBottom: idx < closingSummary.sales.length - 1 ? '1px solid var(--border-light)' : 'none' }}
                          >
                            <div>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                #{sale.id} - {sale.sale_type === 'llevar' ? 'Para Llevar' : `Mesa ${sale.mesa_number}`}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '6px' }}>
                                {sale.payment_method_name} - {new Date(sale.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{formatCurrency(sale.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Error al cargar resumen</p>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)', padding: '1rem 1.25rem' }}>
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowClosingSummary(false); setClosingSummary(null); }} style={{ borderRadius: '10px' }}>
                  Cancelar
                </button>
                <button className="btn px-4" style={{ borderRadius: '10px', backgroundColor: 'var(--danger)', color: 'white', fontWeight: 600 }} onClick={() => { setShowClosingSummary(false); setShowCloseModal(true); }}>
                  <i className="bi bi-lock me-2"></i>Continuar con Cierre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL ABRIR CAJA ===== */}
      {showOpenModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '1rem 1.25rem' }}>
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  <i className="bi bi-lock-open me-2" style={{ color: 'var(--success)' }}></i>
                  Abrir Caja
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowOpenModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '1.25rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Ingrese el monto inicial en efectivo para comenzar el día.
                </p>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Monto Inicial (Bs.)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    className="form-control"
                    style={{ fontSize: '1.2rem', fontWeight: 700, textAlign: 'center', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    placeholder="0.00"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)', padding: '1rem 1.25rem' }}>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowOpenModal(false)} style={{ borderRadius: '10px' }}>
                  Cancelar
                </button>
                <button className="btn btn-accent px-4" style={{ borderRadius: '10px' }} onClick={handleOpen} disabled={processing}>
                  {processing ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                  Abrir Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '1rem 1.25rem' }}>
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  <i className="bi bi-lock me-2" style={{ color: 'var(--danger)' }}></i>
                  Cerrar Caja
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCloseModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '1.25rem' }}>
                <div className="p-3 mb-3" style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>Monto Inicial</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(openRegister?.opening_amount)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>Ventas Efectivo</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(openRegister?.cash_sales)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>Ventas QR</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(openRegister?.qr_sales)}</span>
                  </div>
                  <hr style={{ borderColor: 'var(--border-light)', margin: '0.5rem 0' }} />
                  <div className="d-flex justify-content-between">
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Esperado</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                      {formatCurrency(Number(openRegister?.opening_amount || 0) + Number(openRegister?.total_sales || 0))}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Monto en Efectivo (Bs.)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    className="form-control"
                    style={{ fontSize: '1.2rem', fontWeight: 700, textAlign: 'center', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    placeholder="0.00"
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)', padding: '1rem 1.25rem' }}>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCloseModal(false)} style={{ borderRadius: '10px' }}>
                  Cancelar
                </button>
                <button className="btn px-4" style={{ borderRadius: '10px', backgroundColor: 'var(--danger)', color: 'white' }} onClick={handleClose} disabled={processing}>
                  {processing ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                  Cerrar Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegister;
