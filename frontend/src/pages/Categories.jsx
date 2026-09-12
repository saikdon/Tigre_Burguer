import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import categoryService from '../services/categoryService';

const ICON_OPTIONS = [
  { value: 'bi-fire', label: 'Picante / Más Vendidos' },
  { value: 'bi-lightning-charge', label: 'Rápido / Express' },
  { value: 'bi-cup-hot', label: 'Café / Bebida Caliente' },
  { value: 'bi-cup-straw', label: 'Refresco / Bebida Fría' },
  { value: 'bi-cup', label: 'Bebida / Vaso' },
  { value: 'bi-fork-knife', label: 'Comida / Plato' },
  { value: 'bi-egg-fried', label: 'Desayuno / Huevo' },
  { value: 'bi-apple', label: 'Fruta / Saludable' },
  { value: 'bi-cookie', label: 'Snack / Galleta' },
  { value: 'bi-cake', label: 'Pastel / Postre' },
  { value: 'bi-cake2', label: 'Torta / Repostería' },
  { value: 'bi-icecream', label: 'Helado / Fernet' },
  { value: 'bi-droplet', label: 'Salsa / Líquido' },
  { value: 'bi-thermometer', label: 'Caliente / Frito' },
  { value: 'bi-gift', label: 'Combo / Especial' },
  { value: 'bi-star', label: 'Favorito / Top' },
  { value: 'bi-heart', label: 'Popular / Favorito' },
  { value: 'bi-trophy', label: 'Mejor / Premium' },
  { value: 'bi-gem', label: 'Exclusivo / Premium' },
  { value: 'bi-tag', label: 'Etiqueta / Precio' },
  { value: 'bi-emoji-smile', label: 'Satisfacción' },
  { value: 'bi-speedometer2', label: 'Rápido' },
  { value: 'bi-graph-up', label: 'Tendencia' },
  { value: 'bi-truck', label: 'Delivery / Envío' },
  { value: 'bi-bag-plus', label: 'Para Llevar' },
  { value: 'bi-basket', label: 'Canasta / Pedido' },
  { value: 'bi-cart-plus', label: 'Carrito / Agregar' },
  { value: 'bi-box', label: 'Caja / Empaque' },
  { value: 'bi-shop', label: 'Local / Tienda' },
  { value: 'bi-journal-richtext', label: 'Menú / Carta' },
  { value: 'bi-palette', label: 'Variedad / Especial' },
  { value: 'bi-calendar-event', label: 'Evento / Reserva' },
];

const Categories = () => {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '', status: 'activo' });
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (showModal && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showModal]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '', status: 'activo' });
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || '', icon: cat.icon || '', status: cat.status });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, formData);
      } else {
        await categoryService.create(formData);
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    try {
      await categoryService.delete(cat.id);
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
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
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 style={{ fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Categorías</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Organiza tus productos por categoría</p>
        </div>
        {isAdmin && (
          <button className="btn btn-accent" onClick={openCreateModal}>
            <i className="bi bi-plus-lg me-2"></i>Nueva Categoría
          </button>
        )}
      </div>

      <div className="row g-3">
        {categories.map((cat) => (
          <div key={cat.id} className="col-sm-6 col-lg-4 col-xl-3">
            <div
              className="p-4 h-100"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease'
              }}
            >
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 90, 0, 0.1)',
                    color: 'var(--accent)',
                    fontSize: '1.2rem'
                  }}
                >
                  <i className={`bi ${cat.icon || 'bi-tag-fill'}`}></i>
                </div>
                <span
                  className={`badge ${cat.status === 'activo' ? 'bg-success' : 'bg-secondary'}`}
                  style={{ borderRadius: '8px' }}
                >
                  {cat.status === 'activo' ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <h5 style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{cat.name}</h5>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minHeight: '2.5em' }}>
                {cat.description || 'Sin descripción'}
              </p>
              {isAdmin && (
                <div className="d-flex gap-2 mt-auto">
                  <button className="btn btn-sm btn-outline-accent flex-grow-1" onClick={() => openEditModal(cat)}>
                    <i className="bi bi-pencil me-1"></i>Editar
                  </button>
                  <button
                    className="btn btn-sm flex-grow-1"
                    style={{ color: 'var(--danger)', border: '1px solid var(--danger)', backgroundColor: 'transparent' }}
                    onClick={() => handleDelete(cat)}
                  >
                    <i className="bi bi-trash me-1"></i>Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Nombre *
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Descripción
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Icono
                    </label>
                    <div
                      className="d-flex flex-wrap gap-2 p-2"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          title={opt.label}
                          onClick={() => setFormData({ ...formData, icon: opt.value })}
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            border: formData.icon === opt.value ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                            backgroundColor: formData.icon === opt.value ? 'var(--accent-light)' : 'var(--bg-card)',
                            color: formData.icon === opt.value ? 'var(--accent)' : 'var(--text-secondary)',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <i className={`bi ${opt.value}`}></i>
                        </button>
                      ))}
                      {formData.icon && (
                        <button
                          type="button"
                          title="Quitar icono"
                          onClick={() => setFormData({ ...formData, icon: '' })}
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            border: '1px solid var(--danger)',
                            backgroundColor: 'transparent',
                            color: 'var(--danger)',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  {editingCategory && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Estado
                      </label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)' }}>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)} style={{ borderRadius: '10px' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-accent" style={{ borderRadius: '10px' }}>
                    {editingCategory ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
