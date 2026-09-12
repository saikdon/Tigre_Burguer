import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import saleService from '../services/saleService';
import cashRegisterService from '../services/cashRegisterService';
import SplitPayment from '../components/SplitPayment';
import { ClawAccent } from '../components/TigreBranding';

const CATEGORY_ICONS = {
  top: 'bi-fire',
};

const ProductPlaceholder = ({ name }) => (
  <div
    style={{
      width: '100%',
      height: '140px',
      borderRadius: 'var(--radius-md)',
      background: 'linear-gradient(135deg, #FFF0E6, #FFE4D0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '0.75rem',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <i className="bi bi-image" style={{ fontSize: '2rem', color: 'var(--accent)', opacity: 0.4 }}></i>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{name?.substring(0, 15)}</div>
    </div>
  </div>
);

const CategoryIcon = ({ category }) => {
  const basePath = `/images/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`;
  const [ext, setExt] = useState(null);

  useEffect(() => {
    const tryLoad = async (e) => {
      for (const ex of ['png', 'svg']) {
        try {
          const resp = await fetch(`${basePath}.${ex}`, { method: 'HEAD' });
          if (resp.ok) { setExt(ex); return; }
        } catch {}
      }
      setExt('none');
    };
    tryLoad();
  }, [basePath]);

  if (ext === 'none') return category.icon ? <i className={`bi ${category.icon}`}></i> : null;
  if (!ext) return category.icon ? <i className={`bi ${category.icon}`} style={{ opacity: 0.4 }}></i> : null;

  return (
    <img
      src={`${basePath}.${ext}`}
      alt={category.name}
      width="20"
      height="20"
      style={{ objectFit: 'contain', borderRadius: '4px' }}
    />
  );
};

const NewOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('top');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [payments, setPayments] = useState([{ payment_method: 'Efectivo', amount: 0 }]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [openRegister, setOpenRegister] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState('');
  const [saleResult, setSaleResult] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, cats, register, top] = await Promise.all([
        productService.getActive(),
        categoryService.getActive(),
        cashRegisterService.getOpen(),
        productService.getTopSelling()
      ]);
      setProducts(prods);
      setCategories(cats);
      setOpenRegister(register);
      setTopSelling(top);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (searchTerm) {
      return p.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    if (selectedFilter === 'top') {
      return topSelling.some((t) => t.id === p.id);
    }
    if (selectedFilter) {
      return p.category_id === parseInt(selectedFilter);
    }
    return true;
  });

  const addToOrder = (product) => {
    const existing = orderItems.find((item) => item.product_id === product.id);
    if (existing) {
      setOrderItems(
        orderItems.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
            : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: Number(product.price),
          subtotal: Number(product.price),
          notes: '',
          image_url: product.image_url || null,
        }
      ]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setOrderItems(
      orderItems
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return { ...item, quantity: newQty, subtotal: newQty * item.unit_price };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromOrder = (productId) => {
    setOrderItems(orderItems.filter((item) => item.product_id !== productId));
  };

  const clearOrder = () => {
    setOrderItems([]);
  };

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = orderItems.reduce((sum, i) => sum + i.quantity, 0);

  const handleCheckout = () => {
    if (orderItems.length === 0) {
      setShowError('Agregue al menos un producto');
      setTimeout(() => setShowError(''), 3000);
      return;
    }
    if (!openRegister) {
      setShowError('No hay una caja abierta');
      setTimeout(() => setShowError(''), 3000);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSale = async () => {
    setProcessing(true);
    try {
      const result = await saleService.createTakeaway(
        orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes
        })),
        payments
      );
      setSaleResult(result.sale);
      setShowConfirmModal(false);
      setOrderItems([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setShowConfirmModal(false);
      setShowError(err.response?.data?.message || 'Error al registrar la venta');
      setTimeout(() => setShowError(''), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveNote, setReserveNote] = useState('');

  const handleReserve = () => {
    if (orderItems.length === 0) {
      setShowError('Agregue al menos un producto');
      setTimeout(() => setShowError(''), 3000);
      return;
    }
    setShowReserveModal(true);
  };

  const handleConfirmReserve = async () => {
    setProcessing(true);
    try {
      await saleService.createReservation(
        orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes
        })),
        reserveNote
      );
      setShowReserveModal(false);
      setOrderItems([]);
      setReserveNote('');
      setShowSuccess(true);
      setSaleResult({ total: orderItems.reduce((s, i) => s + i.subtotal, 0), status: 'reservada' });
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setShowReserveModal(false);
      setShowError(err.response?.data?.message || 'Error al crear reserva');
      setTimeout(() => setShowError(''), 3000);
    } finally {
      setProcessing(false);
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
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 style={{ fontWeight: 800, letterSpacing: '-0.5px', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            Nueva Orden
          </h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Seleccione productos para crear una orden
          </p>
        </div>
        {orderItems.length > 0 && (
          <button
            className="btn btn-sm d-flex align-items-center gap-1"
            style={{
              backgroundColor: 'var(--danger-light)',
              border: '1px solid rgba(229, 57, 53, 0.2)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              fontSize: '0.85rem',
              padding: '0.4rem 0.8rem',
            }}
            onClick={clearOrder}
          >
            <i className="bi bi-trash3"></i>Limpiar
          </button>
        )}
      </div>

      <div className="row g-4">
        {/* LEFT: Product Catalog */}
        <div className="col-lg-7 col-xl-8">
          {/* Search Bar */}
          <div className="mb-3">
            <div className="position-relative">
              <i className="bi bi-search position-absolute" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1rem' }}></i>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '42px', height: '46px', fontSize: '0.9rem', borderRadius: 'var(--radius-md)' }}
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            <button
              className={`btn btn-sm d-flex align-items-center gap-1 ${selectedFilter === 'top' ? 'btn-accent' : ''}`}
              style={selectedFilter === 'top' ? { borderRadius: '50px', padding: '0.45rem 1rem' } : {
                backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-color)', color: 'var(--text-secondary)',
                borderRadius: '50px', padding: '0.45rem 1rem', fontWeight: 500, fontSize: '0.85rem',
                transition: 'all 0.25s ease',
              }}
              onClick={() => setSelectedFilter('top')}
            >
              <i className="bi bi-fire"></i>Más Vendidos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`btn btn-sm d-flex align-items-center gap-1 ${selectedFilter === String(cat.id) ? 'btn-accent' : ''}`}
                style={selectedFilter === String(cat.id) ? { borderRadius: '50px', padding: '0.45rem 1rem' } : {
                  backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-color)', color: 'var(--text-secondary)',
                  borderRadius: '50px', padding: '0.45rem 1rem', fontWeight: 500, fontSize: '0.85rem',
                  transition: 'all 0.25s ease',
                }}
                onClick={() => setSelectedFilter(String(cat.id))}
              >
                <CategoryIcon category={cat} />
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="row g-3">
            {filteredProducts.map((product) => {
              const inOrder = orderItems.find((item) => item.product_id === product.id);
              return (
                <div key={product.id} className="col-sm-6 col-md-4 col-lg-6 col-xl-4">
                  <div
                    className={`product-card-pos ${inOrder ? 'selected' : ''}`}
                    onClick={() => addToOrder(product)}
                    style={{ padding: 0, overflow: 'hidden' }}
                  >
                    {/* Product Image */}
                    {product.image_url ? (
                      <div style={{ width: '100%', height: '140px', overflow: 'hidden' }}>
                        <img
                          src={product.image_url}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <ProductPlaceholder name={product.name} />
                    )}

                    {/* Product Info */}
                    <div className="p-3 pt-2">
                      <div className="d-flex align-items-start justify-content-between">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              lineHeight: 1.2,
                              color: 'var(--text-primary)',
                              marginBottom: '4px',
                            }}
                          >
                            {product.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {product.category_name}
                          </div>
                        </div>
                        <div
                          className="d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: inOrder ? 'var(--accent)' : 'var(--accent-light)',
                            color: inOrder ? '#fff' : 'var(--accent)',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            transition: 'all 0.25s ease',
                            boxShadow: inOrder ? '0 3px 10px rgba(255, 90, 0, 0.3)' : 'none',
                          }}
                        >
                          {inOrder ? (
                            <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{inOrder.quantity}</span>
                          ) : (
                            <i className="bi bi-plus-lg" style={{ fontSize: '0.95rem' }}></i>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          color: 'var(--accent)',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          marginTop: '8px',
                        }}
                      >
                        Bs. {Number(product.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-12 text-center py-5" style={{ color: 'var(--text-muted)' }}>
                <i className="bi bi-search" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem', opacity: 0.3 }}></i>
                <div style={{ fontSize: '0.95rem' }}>No se encontraron productos</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Order Panel */}
        <div className="col-lg-5 col-xl-4">
          <div
            style={{
              position: 'sticky',
              top: 'calc(var(--header-height) + 1rem)',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden',
            }}
          >
            {/* Order Header */}
            <div
              className="p-3 d-flex align-items-center justify-content-between position-relative"
              style={{ borderBottom: '1px solid var(--border-light)', overflow: 'hidden' }}
            >
              <ClawAccent direction="left" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.08 }} />
              <h6 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>
                <i className="bi bi-bag me-2" style={{ color: 'var(--accent)' }}></i>
                Orden
              </h6>
              {orderItems.length > 0 && (
                <span
                  className="px-2 py-1"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '50px',
                  }}
                >
                  {totalItems} uds
                </span>
              )}
            </div>

            {/* Order Items */}
            <div className="p-3" style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {orderItems.length === 0 ? (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-input)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem',
                    }}
                  >
                    <i className="bi bi-bag" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Seleccione productos</div>
                </div>
              ) : (
                orderItems.map((item) => (
                  <div key={item.product_id} className="order-item">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center gap-1">
                        <button
                          className="btn btn-sm p-0 d-flex align-items-center justify-content-center"
                          style={{
                            width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)', fontSize: '0.8rem',
                          }}
                          onClick={(e) => { e.stopPropagation(); updateQuantity(item.product_id, -1); }}
                        >
                          <i className="bi bi-dash"></i>
                        </button>
                        <div
                          className="d-flex align-items-center justify-content-center"
                          style={{
                            width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--accent)', color: 'white',
                            fontWeight: 700, fontSize: '0.85rem',
                          }}
                        >
                          {item.quantity}
                        </div>
                        <button
                          className="btn btn-sm p-0 d-flex align-items-center justify-content-center"
                          style={{
                            width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--accent)', border: 'none', color: 'white', fontSize: '0.8rem',
                          }}
                          onClick={(e) => { e.stopPropagation(); updateQuantity(item.product_id, 1); }}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.product_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Bs. {item.unit_price.toFixed(2)} c/u
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>Bs. {item.subtotal.toFixed(2)}</span>
                      <button
                        className="btn btn-sm p-0"
                        style={{ color: 'var(--text-muted)', backgroundColor: 'transparent', border: 'none', fontSize: '0.9rem' }}
                        onClick={(e) => { e.stopPropagation(); removeFromOrder(item.product_id); }}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Summary + Payment */}
            {orderItems.length > 0 && (
              <div className="p-3" style={{ borderTop: '1px solid var(--border-light)' }}>
                {/* Totals */}
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Subtotal</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Bs. {total.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3 pb-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)' }}>Bs. {total.toFixed(2)}</span>
                </div>

                {/* Split Payment */}
                <div className="mb-3">
                  <SplitPayment total={total} onPaymentsChange={setPayments} />
                </div>

                {/* Actions */}
                <button
                  className="btn w-100 py-3 mb-2"
                  style={{
                    fontSize: '0.95rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 700,
                    boxShadow: '0 4px 16px rgba(255, 90, 0, 0.3)',
                    transition: 'all 0.25s ease',
                    border: 'none',
                  }}
                  onClick={handleCheckout}
                  disabled={processing || orderItems.length === 0 || !openRegister}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 90, 0, 0.4)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 90, 0, 0.3)'; }}
                >
                  {processing ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Procesando...</>
                  ) : (
                    <><i className="bi bi-check-circle me-2"></i>Registrar Venta</>
                  )}
                </button>

                <button
                  className="btn w-100 py-2.5"
                  style={{
                    fontSize: '0.9rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1.5px solid var(--accent)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    transition: 'all 0.25s ease',
                  }}
                  onClick={handleReserve}
                  disabled={processing || orderItems.length === 0}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }}
                >
                  <i className="bi bi-bookmark-plus me-2"></i>Reservar Pedido
                </button>

                {!openRegister && (
                  <div className="text-center mt-2" style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                    <i className="bi bi-exclamation-circle me-1"></i>No hay caja abierta
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOAST EXITO */}
      {showSuccess && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, animation: 'slideIn 0.3s ease' }}>
          <div
            className="d-flex align-items-center gap-3 px-4 py-3"
            style={{
              backgroundColor: '#fff',
              border: '1px solid rgba(22, 163, 74, 0.3)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 30px rgba(22, 163, 74, 0.15)',
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--success-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--success)', fontSize: '1.2rem',
            }}>
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{saleResult?.status === 'reservada' ? 'Reserva registrada' : 'Venta registrada'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bs. {Number(saleResult?.total || total).toFixed(2)}{payments.length > 1 ? ` (${payments.length} metodos)` : ` - ${payments[0]?.payment_method}`}</div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST ERROR */}
      {showError && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, animation: 'slideIn 0.3s ease' }}>
          <div
            className="d-flex align-items-center gap-3 px-4 py-3"
            style={{
              backgroundColor: '#fff',
              border: '1px solid rgba(229, 57, 53, 0.3)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 30px rgba(229, 57, 53, 0.15)',
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', fontSize: '1.2rem',
            }}>
              <i className="bi bi-exclamation-circle-fill"></i>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{showError}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR VENTA */}
      {showConfirmModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ border: 'none' }}>
              <div className="modal-header" style={{ border: 'none', paddingBottom: 0 }}>
                <h5 className="modal-title" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  <i className="bi bi-bag-check me-2" style={{ color: 'var(--success)' }}></i>
                  Confirmar Venta
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="text-center mb-3">
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)' }}>Bs. {total.toFixed(2)}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total a cobrar</div>
                </div>
                <div className="p-3 mb-3" style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tipo</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Para Llevar</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Productos</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{totalItems} unidades</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pago</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {payments.length === 1
                        ? payments[0].payment_method
                        : payments.map(p => `Bs. ${Number(p.amount).toFixed(2)} ${p.payment_method}`).join(' + ')
                      }
                    </span>
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '160px', overflowY: 'auto' }}>
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center px-3 py-2" style={{ borderBottom: idx < orderItems.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <span style={{ fontSize: '0.85rem' }}>{item.product_name} <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span></span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Bs. {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer" style={{ border: 'none', paddingTop: 0 }}>
                <button type="button" className="btn" onClick={() => setShowConfirmModal(false)} style={{ borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>Cancelar</button>
                <button className="btn px-4" style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success)', color: 'white', fontWeight: 600, border: 'none', boxShadow: '0 3px 12px rgba(22, 163, 74, 0.3)' }} onClick={handleConfirmSale} disabled={processing}>
                  {processing ? <><span className="spinner-border spinner-border-sm me-2"></span>Procesando...</> : <><i className="bi bi-check-circle me-2"></i>Confirmar Venta</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESERVAR PEDIDO */}
      {showReserveModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ border: 'none' }}>
              <div className="modal-header" style={{ border: 'none', paddingBottom: 0 }}>
                <h5 className="modal-title" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  <i className="bi bi-bookmark-plus me-2" style={{ color: 'var(--warning)' }}></i>
                  Reservar Pedido
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowReserveModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="text-center mb-3">
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning)' }}>Bs. {total.toFixed(2)}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total del pedido</div>
                </div>
                <div className="p-3 mb-3" style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <div className="d-flex justify-content-between">
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Productos</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{totalItems} unidades</span>
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '140px', overflowY: 'auto', marginBottom: '1rem' }}>
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center px-3 py-2" style={{ borderBottom: idx < orderItems.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <span style={{ fontSize: '0.85rem' }}>{item.product_name} <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span></span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Bs. {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="p-3" style={{ backgroundColor: 'var(--warning-light)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-md)' }}>
                  <div className="d-flex align-items-center gap-2 mb-1" style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '0.9rem' }}>
                    <i className="bi bi-info-circle"></i> Info
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                    El pedido queda guardado como reserva. Cuando el cliente llegue, cobralo desde la pagina de Reservas.
                  </p>
                </div>
              </div>
              <div className="modal-footer" style={{ border: 'none', paddingTop: 0 }}>
                <button type="button" className="btn" onClick={() => setShowReserveModal(false)} style={{ borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>Cancelar</button>
                <button className="btn px-4" style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'var(--warning)', color: '#222', fontWeight: 700, border: 'none' }} onClick={handleConfirmReserve} disabled={processing}>
                  {processing ? <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</> : <><i className="bi bi-bookmark-plus me-2"></i>Reservar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default NewOrder;
