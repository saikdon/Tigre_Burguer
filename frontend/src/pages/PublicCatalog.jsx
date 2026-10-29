import { useEffect, useMemo, useState } from 'react';
import publicCatalogService from '../services/publicCatalogService';
import './PublicCatalog.css';
import './PublicCatalogCustomizations.css';

const money = (value) => `Bs. ${Number(value || 0).toFixed(2)}`;
const backendOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const qrPaymentImage = '/images/tigre-burger-payment-qr.png';
const sauceOptions = ['Ketchup', 'Mayonesa', 'Mostaza', 'Llajua'];
const saladOptions = ['Cebolla', 'Tomate'];
const allows = (value) => value === true || Number(value) === 1;
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
    const customizations = { sauces: [], salad: [] };
    const present = current.find((item) => item.id === product.id && !item.customizations.sauces.length && !item.customizations.salad.length);
    return present ? current.map((item) => item.lineId === present.lineId ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, lineId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, quantity: 1, customizations }];
  });
  const changeQuantity = (lineId, delta) => setCart((current) => current.flatMap((item) => item.lineId !== lineId ? [item] : item.quantity + delta > 0 ? [{ ...item, quantity: item.quantity + delta }] : []));
  const toggleCustomization = (lineId, type, option) => setCart((current) => current.map((item) => {
    if (item.lineId !== lineId) return item;
    const selected = item.customizations[type] || [];
    const next = selected.includes(option) ? selected.filter((value) => value !== option) : [...selected, option];
    return { ...item, customizations: { ...item.customizations, [type]: next } };
  }));

  const reserve = async (event) => {
    event.preventDefault();
    if (!cart.length) return setError('Agregá por lo menos un producto a tu pedido.');
    setError(''); setSending(true);
    try {
      const result = await publicCatalogService.createReservation({
        ...customer,
        items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity, customizations: item.customizations }))
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
        {!cart.length ? <p className="cart-empty">Elegí algo del menú y aparecerá aquí.</p> : cart.map((item) => <div className="cart-line" key={item.lineId}><div className="cart-line-main"><div className="cart-line-title"><div><strong>{item.name}</strong><span>{money(item.price)} cada uno</span></div><div className="line-actions"><button onClick={() => changeQuantity(item.lineId, -1)} aria-label={`Quitar ${item.name}`}>−</button><b>{item.quantity}</b><button onClick={() => changeQuantity(item.lineId, 1)} aria-label={`Agregar ${item.name}`}>+</button></div></div>{(allows(item.allows_sauces) || allows(item.allows_salad)) && <div className="customization-box"><span className="customization-label"><i className="bi bi-sliders"></i> Personalizá este plato</span>{allows(item.allows_sauces) ? <div className="choice-group"><small>Aderezos</small><div className="choice-chips">{sauceOptions.map((option) => <button type="button" key={option} className={item.customizations.sauces.includes(option) ? 'selected' : ''} onClick={() => toggleCustomization(item.lineId, 'sauces', option)}>{option}</button>)}</div></div> : null}{allows(item.allows_salad) ? <div className="choice-group"><small>Ensalada</small><div className="choice-chips">{saladOptions.map((option) => <button type="button" key={option} className={item.customizations.salad.includes(option) ? 'selected' : ''} onClick={() => toggleCustomization(item.lineId, 'salad', option)}>{option}</button>)}</div></div> : null}</div>}</div></div>)}
      </div>
      <form onSubmit={reserve} className="reservation-form">
        <div className="cart-total"><span>Total estimado</span><strong>{money(total)}</strong></div>
        <label>Nombre y apellido<input required minLength="2" value={customer.customer_name} onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })} placeholder="Ej. María Pérez" /></label>
        <label>Celular<input required value={customer.customer_phone} onChange={(e) => setCustomer({ ...customer, customer_phone: e.target.value })} placeholder="Ej. 71234567" inputMode="tel" /></label>
        <label>¿Cómo querés pagar?</label>
        <div className="payment-options"><button type="button" className={customer.payment_preference === 'Efectivo' ? 'chosen' : ''} onClick={() => setCustomer({ ...customer, payment_preference: 'Efectivo' })}><i className="bi bi-cash-stack"></i><span>Efectivo<small>Pago al recoger</small></span></button><button type="button" className={customer.payment_preference === 'QR' ? 'chosen' : ''} onClick={() => setCustomer({ ...customer, payment_preference: 'QR' })}><i className="bi bi-qr-code"></i><span>QR<small>Se confirma al recoger</small></span></button></div>
        {customer.payment_preference === 'QR' && <section className="qr-payment-panel" aria-label="Código QR para pago" style={{ display: 'grid', gridTemplateColumns: '108px minmax(0, 1fr)', gap: '12px', alignItems: 'center', marginTop: '12px', padding: '12px', background: '#fff4eb', border: '1px solid #f1c9ad', color: '#5c321b' }}>
          <img src={qrPaymentImage} alt="Código QR de pago de Tigre Burger" style={{ display: 'block', width: '108px', height: '108px', objectFit: 'contain', background: '#fff', border: '1px solid #ead3bf' }} />
          <div>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ink)' }}><i className="bi bi-qr-code-scan" style={{ color: 'var(--orange)', fontSize: '18px' }}></i> Pago por QR</strong>
            <p style={{ margin: '6px 0', color: '#6c4936' }}>Escaneá el QR y presentá tu comprobante al recoger.</p>
            <small style={{ display: 'block', color: '#8a664f' }}>El personal confirmará el pago al momento de la entrega.</small>
          </div>
        </section>}
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
