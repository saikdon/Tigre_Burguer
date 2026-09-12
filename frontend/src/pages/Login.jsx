import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TigreLogo, ClawMarks, TigerStripes } from '../components/TigreBranding';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background image */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'url(/images/fondo.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 55%',
          backgroundRepeat: 'no-repeat',
          opacity: 0.5,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Tiger stripe background pattern */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.025,
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 30px,
            #FF5A00 30px,
            #FF5A00 31px
          )`,
          pointerEvents: 'none',
        }}
      />
      <TigerStripes style={{ top: 0, left: 0, width: '300px', height: '100%', opacity: 0.6 }} />
      <TigerStripes style={{ bottom: 0, right: 0, width: '250px', height: '100%', opacity: 0.4, transform: 'scaleX(-1)' }} />

      <div
        className="login-card"
        style={{ position: 'relative', animation: 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden' }}
      >
        <TigerStripes style={{ top: 0, right: 0, width: '140px', height: '100%', opacity: 0.5 }} />
        <ClawMarks style={{ bottom: '10px', left: '10px', width: '50px', height: '70px', opacity: 0.08, transform: 'rotate(-15deg)' }} />

        {/* Brand Header */}
        <div className="text-center mb-4" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', marginBottom: '12px' }}>
            <TigreLogo size={72} />
          </div>
          <h2 style={{ fontWeight: 800, letterSpacing: '-0.5px', fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
            TIGRE BURGER
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Sistema POS
          </p>
        </div>

        {error && (
          <div
            className="d-flex align-items-center gap-2 py-2.5 px-3 mb-3"
            style={{
              backgroundColor: 'var(--danger-light)',
              border: '1px solid rgba(229, 57, 53, 0.2)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            <i className="bi bi-exclamation-circle-fill"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
              Usuario
            </label>
            <div className="position-relative">
              <i
                className="bi bi-person position-absolute"
                style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1rem' }}
              ></i>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '42px', height: '48px', fontSize: '0.9rem', borderRadius: 'var(--radius-md)' }}
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
              Contraseña
            </label>
            <div className="position-relative">
              <i
                className="bi bi-lock position-absolute"
                style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1rem' }}
              ></i>
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '42px', height: '48px', fontSize: '0.9rem', borderRadius: 'var(--radius-md)' }}
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn w-100 py-3"
            style={{
              fontSize: '0.95rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              boxShadow: '0 4px 16px rgba(255, 90, 0, 0.3)',
              transition: 'all 0.25s ease',
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Ingresando...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div style={{ padding: '6px 12px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginBottom: '4px' }}>
            Admin: <strong>admin</strong> / admin123
          </div>
          <div style={{ padding: '6px 12px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            Cajero: <strong>cajero</strong> / cajero123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
