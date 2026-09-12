import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import productService from '../services/productService';
import categoryService from '../services/categoryService';

const Products = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    category_id: '',
    price: '',
    status: 'activo'
  });
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (showModal && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showModal]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        productService.getAll(),
        categoryService.getAll()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || p.category_id === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', image_url: '', category_id: '', price: '', status: 'activo' });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      image_url: product.image_url || '',
      category_id: product.category_id,
      price: product.price,
      status: product.status
    });
    setImageFile(null);
    setImagePreview(product.image_url || null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData({ ...formData, image_url: '' });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData({ ...formData, image_url: '' });
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, formData, imageFile);
      } else {
        await productService.create(formData, imageFile);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`¿Eliminar el producto "${product.name}"?`)) return;
    try {
      await productService.delete(product.id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const toggleStatus = async (product) => {
    const newStatus = product.status === 'activo' ? 'inactivo' : 'activo';
    try {
      await productService.update(product.id, { status: newStatus });
      loadData();
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const toggleTopSelling = async (product) => {
    try {
      await productService.toggleTopSelling(product.id);
      loadData();
    } catch (err) {
      alert('Error al cambiar');
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
          <h3 style={{ fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Productos</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Gestión del catálogo de productos</p>
        </div>
        {isAdmin && (
          <button className="btn btn-accent" onClick={openCreateModal}>
            <i className="bi bi-plus-lg me-2"></i>Nuevo Producto
          </button>
        )}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="position-relative">
            <i className="bi bi-search position-absolute" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '42px' }}
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div className="table-responsive">
          <table className="table mb-0" style={{ color: 'var(--text-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Producto</th>
                <th style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Categoría</th>
                <th style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Precio</th>
                <th style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Destacado</th>
                <th style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Estado</th>
                {isAdmin && <th className="text-end" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          backgroundColor: 'rgba(255, 90, 0, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <i className="bi bi-image" style={{ color: 'var(--accent)', fontSize: '1.1rem', opacity: 0.5 }}></i>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.name}</div>
                        {product.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{product.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="px-2 py-1 rounded-3"
                      style={{ backgroundColor: 'rgba(255, 90, 0, 0.1)', color: 'var(--accent)', fontSize: '0.85rem' }}
                    >
                      {product.category_name}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Bs. {Number(product.price).toFixed(2)}</td>
                  <td>
                    <button
                      className="btn btn-sm p-1"
                      onClick={() => isAdmin && toggleTopSelling(product)}
                      disabled={!isAdmin}
                      title={product.is_top_selling ? 'Quitar de Más Vendidos' : 'Marcar como Más Vendido'}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: product.is_top_selling ? '#FFB800' : 'var(--text-muted)',
                        fontSize: '1.2rem',
                        opacity: isAdmin ? 1 : 0.5,
                        cursor: isAdmin ? 'pointer' : 'default',
                      }}
                    >
                      <i className={`bi ${product.is_top_selling ? 'bi-star-fill' : 'bi-star'}`}></i>
                    </button>
                  </td>
                  <td>
                    <span
                      className={`badge ${product.status === 'activo' ? 'bg-success' : 'bg-secondary'}`}
                      style={{ borderRadius: '8px', padding: '0.35em 0.8em', cursor: isAdmin ? 'pointer' : 'default' }}
                      onClick={() => isAdmin && toggleStatus(product)}
                    >
                      {product.status === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="text-end">
                      <button
                        className="btn btn-sm me-1"
                        style={{ color: 'var(--text-secondary)', backgroundColor: 'transparent', border: 'none' }}
                        onClick={() => openEditModal(product)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ color: 'var(--danger)', backgroundColor: 'transparent', border: 'none' }}
                        onClick={() => handleDelete(product)}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Image Upload */}
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Imagen del producto
                    </label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-lg)',
                        padding: imagePreview ? '8px' : '24px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: dragOver ? 'rgba(255, 90, 0, 0.04)' : 'var(--bg-body)',
                      }}
                    >
                      {imagePreview ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '160px',
                              borderRadius: 'var(--radius-md)',
                              objectFit: 'cover',
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                            }}
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      ) : (
                        <div>
                          <i className="bi bi-cloud-arrow-up" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}></i>
                          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Arrastra una imagen o <span style={{ color: 'var(--accent)', fontWeight: 600 }}>selecciona un archivo</span>
                          </p>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>JPG, PNG, GIF o WebP (max 5MB)</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                  </div>

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
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Categoría *
                      </label>
                      <select
                        className="form-select"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Precio (Bs.) *
                      </label>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        className="form-control"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  {editingProduct && (
                    <div className="mt-3">
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
                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
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

export default Products;
