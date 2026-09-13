import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

const emptyForm = { full_name: '', username: '', role_id: '', password: '', status: 'activo' };

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const nameRef = useRef(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [userRows, roleRows] = await Promise.all([userService.getAll(), userService.getRoles()]);
      setUsers(userRows); setRoles(roleRows);
    } catch (err) { setError(err.response?.data?.message || 'No pudimos cargar los usuarios.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (modal) setTimeout(() => nameRef.current?.focus(), 80); }, [modal]);
  useEffect(() => {
    if (!modal) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setModal(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [modal]);

  const visible = useMemo(() => users.filter((item) =>
    `${item.full_name} ${item.username} ${item.role_name}`.toLowerCase().includes(query.trim().toLowerCase())), [users, query]);
  const summary = {
    activos: users.filter((u) => u.status === 'activo').length,
    admins: users.filter((u) => u.role_name === 'admin' && u.status === 'activo').length,
    cajeros: users.filter((u) => u.role_name === 'cajero' && u.status === 'activo').length,
  };

  const openCreate = () => {
    setEditing(null); setForm({ ...emptyForm, role_id: roles.find((r) => r.name === 'cajero')?.id || roles[0]?.id || '' });
    setFormError(''); setShowPassword(false); setModal(true);
  };
  const openEdit = (item) => {
    setEditing(item); setForm({ full_name: item.full_name, username: item.username, role_id: item.role_id, password: '', status: item.status });
    setFormError(''); setShowPassword(false); setModal(true);
  };
  const save = async (e) => {
    e.preventDefault(); setFormError('');
    if (!editing && form.password.length < 6) return setFormError('La contraseña debe tener mínimo 6 caracteres.');
    if (editing && form.password && form.password.length < 6) return setFormError('La nueva contraseña debe tener mínimo 6 caracteres.');
    setSaving(true);
    try {
      const payload = { ...form, role_id: Number(form.role_id) };
      if (!payload.password) delete payload.password;
      if (editing) await userService.update(editing.id, payload);
      else await userService.create(payload);
      setModal(false); await load();
    } catch (err) {
      const validation = err.response?.data?.errors?.[0]?.message;
      setFormError(validation || err.response?.data?.message || 'No se pudo guardar el usuario.');
    } finally { setSaving(false); }
  };
  const toggleStatus = async (item) => {
    if (item.id === user?.id) return;
    const status = item.status === 'activo' ? 'inactivo' : 'activo';
    try { await userService.update(item.id, { status }); await load(); }
    catch (err) { setError(err.response?.data?.message || 'No se pudo cambiar el estado.'); }
  };

  return <section className="users-page animate-fade-in" aria-labelledby="users-title">
    <header className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div><span className="section-kicker">Administración</span><h2 id="users-title" className="mb-1">Equipo y accesos</h2><p className="text-secondary mb-0">Gestioná quién puede entrar y qué rol tiene.</p></div>
      <button className="btn btn-accent" onClick={openCreate}><i className="bi bi-person-plus-fill me-2"/>Nuevo usuario</button>
    </header>

    <div className="users-summary mb-4">
      {[['bi-person-check-fill','Activos',summary.activos,'success'],['bi-shield-check','Administradores',summary.admins,'accent'],['bi-cash-coin','Cajeros',summary.cajeros,'warning']].map(([icon,label,value,tone]) =>
        <article className="user-stat" key={label}><span className={`user-stat-icon ${tone}`}><i className={`bi ${icon}`}/></span><div><strong>{value}</strong><span>{label}</span></div></article>)}
    </div>

    <div className="users-panel">
      <div className="users-toolbar"><div className="search-control"><i className="bi bi-search"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar por nombre, usuario o rol" aria-label="Buscar usuarios"/></div><span>{visible.length} {visible.length === 1 ? 'usuario' : 'usuarios'}</span></div>
      {error && <div className="state-message error" role="alert"><i className="bi bi-exclamation-circle"/><div><strong>Algo salió mal</strong><p>{error}</p></div><button className="btn btn-sm btn-outline-secondary" onClick={load}>Reintentar</button></div>}
      {loading ? <div className="state-message"><span className="spinner-border spinner-border-sm"/><span>Cargando usuarios…</span></div> : !error && visible.length === 0 ? <div className="state-message empty"><i className="bi bi-people"/><div><strong>{query ? 'Sin coincidencias' : 'Todavía no hay usuarios'}</strong><p>{query ? 'Probá con otra búsqueda.' : 'Creá el primer acceso para tu equipo.'}</p></div></div> : !error && <div className="table-responsive"><table className="table users-table mb-0"><thead><tr><th>Persona</th><th>Rol</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead><tbody>{visible.map((item)=><tr key={item.id}><td><div className="user-cell"><span className="user-avatar">{item.full_name?.[0]?.toUpperCase()}</span><div><strong>{item.full_name}</strong><small>@{item.username}{item.id === user?.id ? ' · Vos' : ''}</small></div></div></td><td><span className={`role-badge ${item.role_name}`}>{item.role_name === 'admin' ? 'Administrador' : 'Cajero'}</span></td><td><span className={`status-label ${item.status}`}><i/>{item.status === 'activo' ? 'Activo' : 'Inactivo'}</span></td><td className="text-end"><button className="btn btn-sm btn-light me-2" onClick={()=>openEdit(item)} title="Editar usuario"><i className="bi bi-pencil me-1"/>Editar</button><button className={`btn btn-sm ${item.status === 'activo' ? 'btn-outline-danger' : 'btn-outline-success'}`} disabled={item.id === user?.id} onClick={()=>toggleStatus(item)} title={item.id === user?.id ? 'No podés cambiar tu propio estado' : undefined}>{item.status === 'activo' ? 'Desactivar' : 'Reactivar'}</button></td></tr>)}</tbody></table></div>}
    </div>

    {modal && <div className="modal d-block users-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}><div className="modal-dialog modal-dialog-centered"><div className="modal-content position-relative"><form onSubmit={save}><div className="modal-header"><div><span className="section-kicker">Acceso al sistema</span><h5 id="user-modal-title" className="modal-title">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h5></div><button type="button" className="btn-close" onClick={()=>setModal(false)} aria-label="Cerrar"/></div><div className="modal-body">
      {formError && <div className="alert alert-danger py-2" role="alert">{formError}</div>}
      <div className="mb-3"><label className="form-label" htmlFor="full-name">Nombre completo</label><input ref={nameRef} id="full-name" className="form-control" required value={form.full_name} onChange={(e)=>setForm({...form,full_name:e.target.value})}/></div>
      <div className="row g-3 mb-3"><div className="col-sm-7"><label className="form-label" htmlFor="username">Usuario</label><input id="username" className="form-control" minLength="3" maxLength="50" required autoComplete="off" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value.trimStart()})}/></div><div className="col-sm-5"><label className="form-label" htmlFor="role">Rol</label><select id="role" className="form-select" required value={form.role_id} onChange={(e)=>setForm({...form,role_id:e.target.value})}>{roles.map((r)=><option key={r.id} value={r.id}>{r.name === 'admin' ? 'Administrador' : 'Cajero'}</option>)}</select></div></div>
      <div className="mb-3"><label className="form-label" htmlFor="password">{editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label><div className="input-group"><input id="password" className="form-control" type={showPassword?'text':'password'} required={!editing} minLength={form.password ? 6 : undefined} autoComplete="new-password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/><button type="button" className="btn btn-outline-secondary" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'}><i className={`bi ${showPassword?'bi-eye-slash':'bi-eye'}`}/></button></div><small className="form-text">Mínimo 6 caracteres. {editing && 'Dejala vacía para mantener la actual.'}</small></div>
      <div><label className="form-label" htmlFor="status">Estado</label><select id="status" className="form-select" value={form.status} disabled={editing?.id===user?.id} onChange={(e)=>setForm({...form,status:e.target.value})}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select>{editing?.id===user?.id && <small className="form-text">Tu propio usuario debe permanecer activo.</small>}</div>
    </div><div className="modal-footer"><button type="button" className="btn btn-light" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-accent" disabled={saving}>{saving && <span className="spinner-border spinner-border-sm me-2"/>}{saving?'Guardando…':'Guardar usuario'}</button></div></form></div></div></div>}
  </section>;
}
