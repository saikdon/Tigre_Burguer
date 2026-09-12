import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tableService from '../services/tableService';
import saleService from '../services/saleService';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import SplitPayment from '../components/SplitPayment';

const TOP_SELLING_NAMES = ['salchipapa', 'hamburguesa con papas', 'salchipapa entera', 'hamburguesa suelta', 'mixta'];

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

const MesaOrder = () => {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [activeSale, setActiveSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('top');
  const [searchTerm, setSearchTerm] = useState('');
  const [payments, setPayments] = useState([{ payment_method: 'Efectivo', amount: 0 }]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    loadData();
  }, [mesaId]);

  const loadData = async () => {
    try {
      const [tbl, sale, prods, cats] = await Promise.all([
        tableService.getById(mesaId),
        saleService.getActiveByMesa(mesaId),
        productService.getActive(),
        categoryService.getActive()
      ]);
      setTable(tbl);
      setActiveSale(sale);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (searchTerm) {
      return p.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    if (selectedFilter === 'top') {
      return TOP_SELLING_NAMES.some((name) => p.name.toLowerCase().includes(name));
    }
    if (selectedFilter) {
      return p.category_id === parseInt(selectedFilter);
    }
    return true;
  });

  const startNewOrder = async (product) => {
    try {
      await saleService.openMesa(mesaId, [{
        product_id: product.id,
        quantity: 1,
        unit_price: Number(product.price)
      }]);
      loadData();
      showToast('Orden creada');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al crear la orden', 'error');
    }
  };

  const addItems = async (product) => {
    if (!activeSale) return;
    try {
      await saleService.addToMesaSale(activeSale.id, [{
        product_id: product.id,
        quantity: 1,
        unit_price: Number(product.price)
      }]);
      loadData();
      showToast('Producto agregado');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al agregar producto', 'error');
    }
  };

  const handleAddProduct = (product) => {
    if (!activeSale) {
      startNewOrder(product);
    } else {
      addItems(product);
    }
  };

  const handleQuantityChange = async (itemId, delta) => {
    const item = activeSale.items.find((i) => i.id === itemId);
    if (!item) return;
    const newQty = item.quantity + delta;
    try {
      await saleService.updateItemQuantity(itemId, newQty);
      loadData();
      showToast('Cantidad actualizada');
    } catch (err) {
      showToast('Error al actualizar cantidad', 'error');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await saleService.removeItem(itemId);
      loadData();
      showToast('Producto eliminado');
    } catch (err) {
      showToast('Error al eliminar producto', 'error');
    }
  };

  const handleCloseSale = async () => {
    if (!activeSale) return;
    setProcessing(true);
    try {
      await saleService.closeMesaSale(activeSale.id, null, payments);
      showToast('Mesa cerrada correctamente');
      setTimeout(() => navigate('/mesas'), 1000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al cerrar la mesa', 'error');
    } finally {
      setProcessing(false);
      setShowPayment(false);
    }
  };

  const saleTotal = activeSale?.items?.reduce((sum, item) => sum + Number(item.subtotal), 0) || 0;

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
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-sm"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            onClick={() => navigate('/mesas')}
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div>
            <h3 style={{ fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
              Mesa {table?.number}
            </h3>
            <span
              className="badge mt-1"
              style={{
                backgroundColor: table?.status === 'libre' ? 'rgba(15, 155, 88, 0.15)' :
                  table?.status === 'ocupada' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(245, 166, 35, 0.15)',
                color: table?.status === 'libre' ? 'var(--success)' :
                  table?.status === 'ocupada' ? 'var(--danger)' : 'var(--warning)',
                fontWeight: 600,
                borderRadius: '8px'
              }}
            >
              {table?.status === 'libre' ? 'Libre' : table?.status === 'ocupada' ? 'Ocupada' : 'Pend. Pago'}
            </span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7 col-xl-8">
          <div className="mb-3">
            <div className="position-relative">
              <i className="bi bi-search position-absolute" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '42px' }}
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex gap-2 mb-3 flex-wrap">
            <button
              className={`btn btn-sm ${selectedFilter === 'top' ? 'btn-accent' : ''}`}
              style={selectedFilter === 'top' ? {} : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              onClick={() => setSelectedFilter('top')}
            >
              <i className="bi bi-fire me-1"></i>Más Vendidos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`btn btn-sm d-flex align-items-center gap-1 ${selectedFilter === String(cat.id) ? 'btn-accent' : ''}`}
                style={selectedFilter === String(cat.id) ? {} : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                onClick={() => setSelectedFilter(String(cat.id))}
              >
                {cat.icon && <i className={`bi ${cat.icon}`}></i>}
                {cat.name}
              </button>
            ))}
          </div>

          <div className="row g-3">
            {filteredProducts.map((product) => {
              const inOrder = activeSale?.items?.some((item) => item.product_id === product.id);
              return (
                <div key={product.id} className="col-sm-6 col-md-4 col-lg-6 col-xl-4">
                  <div
                    className={`product-card-pos ${inOrder ? 'selected' : ''}`}
                    onClick={() => handleAddProduct(product)}
                    style={{ padding: 0, overflow: 'hidden' }}
                  >
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

                    <div className="p-3 pt-2">
                      <div className="d-flex align-items-start justify-content-between">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                            <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                              {activeSale.items.find((i) => i.product_id === product.id)?.quantity || 1}
                            </span>
                          ) : (
                            <i className="bi bi-plus-lg" style={{ fontSize: '0.95rem' }}></i>
                          )}
                        </div>
                      </div>
                      <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '1.1rem', marginTop: '8px' }}>
                        Bs. {Number(product.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-lg-5 col-xl-4">
          <div className="card" style={{ position: 'sticky', top: 'calc(var(--header-height) + 1rem)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
            <div className="p-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                <i className="bi bi-receipt me-2" style={{ color: 'var(--accent)' }}></i>
                Orden - Mesa {table?.number}
              </h6>
            </div>

            <div className="p-3" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {!activeSale || activeSale.items.length === 0 ? (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  <i className="bi bi-bag" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}></i>
                  {table?.status === 'libre' ? 'Seleccione un producto para comenzar' : 'Sin productos'}
                </div>
              ) : (
                activeSale.items.map((item) => (
                  <div key={item.id} className="order-item">
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center gap-1">
                        <button
                          className="btn btn-sm p-0 d-flex align-items-center justify-content-center"
                          style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          <i className="bi bi-dash"></i>
                        </button>
                        <div className="item-qty">{item.quantity}</div>
                        <button
                          className="btn btn-sm p-0 d-flex align-items-center justify-content-center"
                          style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--accent)', border: 'none', color: 'white' }}
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.product_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Bs. {Number(item.unit_price).toFixed(2)} c/u
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Bs. {Number(item.subtotal).toFixed(2)}</span>
                      <button
                        className="btn btn-sm p-0"
                        style={{ color: 'var(--danger)', backgroundColor: 'transparent', border: 'none', fontSize: '1rem' }}
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3" style={{ borderTop: '1px solid var(--border-light)' }}>
              <div className="d-flex justify-content-between mb-3" style={{ fontSize: '1.1rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Bs. {saleTotal.toFixed(2)}</span>
              </div>

              {activeSale && activeSale.items.length > 0 && (
                <button
                  className="btn btn-accent w-100 py-3"
                  style={{ fontSize: '1rem', borderRadius: '12px' }}
                  onClick={() => setShowPayment(true)}
                >
                  <i className="bi bi-credit-card me-2"></i>
                  Cerrar Mesa y Cobrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Cobrar Mesa {table?.number}</h5>
                <button type="button" className="btn-close" onClick={() => setShowPayment(false)}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                    Bs. {saleTotal.toFixed(2)}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>Total a cobrar</div>
                </div>

                <SplitPayment total={saleTotal} onPaymentsChange={setPayments} />
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)' }}>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPayment(false)} style={{ borderRadius: '10px' }}>
                  Cancelar
                </button>
                <button
                  className="btn btn-accent px-4"
                  style={{ borderRadius: '10px' }}
                  onClick={handleCloseSale}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Confirmar Pago
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, animation: 'slideIn 0.3s ease' }}>
          <div className="d-flex align-items-center gap-3 px-4 py-3 rounded-4" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${toastType === 'success' ? 'var(--success)' : 'var(--danger)'}`, boxShadow: `0 8px 30px ${toastType === 'success' ? 'rgba(15,155,88,0.3)' : 'rgba(231,76,60,0.3)'}` }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: toastType === 'success' ? 'rgba(15,155,88,0.15)' : 'rgba(231,76,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: toastType === 'success' ? 'var(--success)' : 'var(--danger)' }}>
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

export default MesaOrder;
