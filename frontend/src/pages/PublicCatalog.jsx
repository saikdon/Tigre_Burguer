import { useEffect, useMemo, useState } from 'react';
import publicCatalogService from '../services/publicCatalogService';
import './PublicCatalog.css';

const money = (value) => `Bs. ${Number(value || 0).toFixed(2)}`;
const backendOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const imageUrl = (value) => {
  if (!value) return null;
  if (value.startsWith('http')) return value;
  const path = value.startsWith('/uploads') ? value : `/uploads/${value}`;
  return `${backendOrigin}${path}`;
};

export default function PublicCatalog() {
  const [catalog, setCatalog] = useState({ categories: [], products: [] });
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState({ customer_name: '', customer_phone: '', payment_preference: 'Efectivo', notes: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    publicCatalogService.getCatalog()
      .then(setCatalog)
      .catch(() => setError('No pudimos cargar el menú. Intentá nuevamente en unos minutos.'))
      .finally(() => setLoading(false));
  }, []);

  const visibleProducts = useMemo(() => catalog.products.filter((product) => category === 'all' || Number(product.category_id) === Number(category)), [catalog.products, category]);
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const units = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addProduct = (product) => setCart((current) => {
    const present = current.find((item) => item.id === product.id);
    return present ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }];
  });
  const changeQuantity = (id, delta) => setCart((current) => current.flatMap((item) => item.id !== id ? [item] : item.quantity + delta > 0 ? [{ ...item, quantity: item.quantity + delta }] : []));

  const reserve = async (event) => {
    event.preventDefault();
    if (!cart.length) return setError('Agregá por lo menos un producto a tu pedido.');
    setError(''); setSending(true);
    try {
      const result = await publicCatalogService.createReservation({
        ...customer,
        items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity }))
      });
      setSuccess(result.reservation);
      setCart([]);
      setShowCart(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.errors?.[0]?.msg || 'No se pudo registrar tu reserva. Revisá los datos e intentá otra vez.');
    } finally { setSending(false); }
  };

  if (success) return (
    <main className="catalog-shell catalog-success">
      <section className="success-panel">
        <span className="eyebrow">RESERVA RECIBIDA</span>
        <i className="bi bi-check2-circle"></i>
        <h1>Tu pedido quedó reservado</h1>
        <p>Reserva #{success.id}. Total estimado: <strong>{money(success.total)}</strong>.</p>
        <p>{success.payment_preference === 'Efectivo' ? 'Pagás en efectivo al recoger tu pedido.' : 'Elegiste pago por QR. El personal confirmará el pago al momento de la entrega.'}</p>
        <button className="catalog-primary" onClick={() => { setSuccess(null); setCustomer({ customer_name: '', customer_phone: '', payment_preference: 'Efectivo', notes: '' }); }}>Hacer otra reserva</button>
      </section>
    </main>
  );

  const cartPanel = (
    <aside className="catalog-cart" aria-label="Tu pedido">
      <div className="cart-head"><div><span className="eyebrow">TU PEDIDO</span><h2>{units ? `${units} producto${units !== 1 ? 's' : ''}` : 'Todavía está vacío'}</h2></div><button className="close-cart" onClick={() => setShowCart(false)} aria-label="Cerrar pedido"><i className="bi bi-x-lg"></i></button></div>
      <div className="cart-lines">
        {!cart.length ? <p className="cart-empty">Elegí algo del menú y aparecerá aquí.</p> : cart.map((item) => <div className="cart-line" key={item.id}><div><strong>{item.name}</strong><span>{money(item.price)} cada uno</span></div><div className="line-actions"><button onClick={() => changeQuantity(item.id, -1)} aria-label={`Quitar ${item.name}`}>−</button><b>{item.quantity}</b><button onClick={() => changeQuantity(item.id, 1)} aria-label={`Agregar ${item.name}`}>+</button></div></div>)}
      </div>
      <form onSubmit={reserve} className="reservation-form">
        <div className="cart-total"><span>Total estimado</span><strong>{money(total)}</strong></div>
        <label>Nombre y apellido<input required minLength="2" value={customer.customer_name} onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })} placeholder="Ej. María Pérez" /></label>
        <label>Celular<input required value={customer.customer_phone} onChange={(e) => setCustomer({ ...customer, customer_phone: e.target.value })} placeholder="Ej. 71234567" inputMode="tel" /></label>
        <label>¿Cómo querés pagar?</label>
        <div className="payment-options"><button type="button" className={customer.payment_preference === 'Efectivo' ? 'chosen' : ''} onClick={() => setCustomer({ ...customer, payment_preference: 'Efectivo' })}><i className="bi bi-cash-stack"></i><span>Efectivo<small>Pago al recoger</small></span></button><button type="button" className={customer.payment_preference === 'QR' ? 'chosen' : ''} onClick={() => setCustomer({ ...customer, payment_preference: 'QR' })}><i className="bi bi-qr-code"></i><span>QR<small>Se confirma al recoger</small></span></button></div>
        {customer.payment_preference === 'QR' && <div className="qr-notice"><i className="bi bi-qr-code-scan"></i><span>Solicitá el QR al confirmar tu pedido. El pago se valida cuando recojas.</span></div>}
        <label>Nota para tu pedido <em>opcional</em><textarea maxLength="500" value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} placeholder="Sin cebolla, por favor" /></label>
        {error && <div className="catalog-error"><i className="bi bi-exclamation-circle"></i>{error}</div>}
        <button disabled={sending || !cart.length} className="catalog-primary" type="submit">{sending ? 'Enviando reserva...' : 'Reservar pedido'}<i className="bi bi-arrow-right"></i></button>
      </form>
    </aside>
  );

  return <main className="catalog-shell">
    <header className="catalog-hero">
      <div className="catalog-brand"><span className="brand-mark">TB</span><span>TIGRE BURGER</span></div>
      <div className="hero-copy"><span className="eyebrow">PEDÍ PARA RECOGER</span><h1>Tu antojo no<br /><em>tiene que esperar.</em></h1><p>Armá tu pedido, reservá desde aquí y pasá a recogerlo cuando esté listo.</p></div>
      <div className="hero-stamp"><i className="bi bi-bag-check"></i><span>Pedido<br />para recoger</span></div>
      <button className="mobile-cart" onClick={() => setShowCart(true)}><i className="bi bi-bag"></i><span>{units}</span> Ver pedido</button>
    </header>
    <section className="catalog-content">
      <div className="catalog-main">
        <div className="category-strip"><button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>Todo el menú</button>{catalog.categories.map((cat) => <button key={cat.id} className={Number(category) === Number(cat.id) ? 'active' : ''} onClick={() => setCategory(cat.id)}>{cat.icon ? `${cat.icon} ` : ''}{cat.name}</button>)}</div>
        {loading ? <div className="catalog-state"><div className="spinner-border"></div><p>Cargando el menú...</p></div> : error && !catalog.products.length ? <div className="catalog-state error"><i className="bi bi-cloud-slash"></i><p>{error}</p></div> : <div className="product-grid">{visibleProducts.map((product, index) => <article className="catalog-product" key={product.id} style={{ animationDelay: `${Math.min(index * 45, 350)}ms` }}><div className="product-photo">{imageUrl(product.image_url) ? <img src={imageUrl(product.image_url)} alt={product.name} /> : <span>{product.name.slice(0, 1)}</span>}<b>{money(product.price)}</b></div><div className="product-body"><span>{product.category_name}</span><h2>{product.name}</h2><p>{product.description || 'Preparado al momento para que lo disfrutes al recoger.'}</p><button onClick={() => addProduct(product)}>Agregar <i className="bi bi-plus-lg"></i></button></div></article>)}</div>}
      </div>
      {cartPanel}
    </section>
    {showCart && <div className="cart-backdrop" onClick={() => setShowCart(false)}><div onClick={(e) => e.stopPropagation()}>{cartPanel}</div></div>}
  </main>;
}
