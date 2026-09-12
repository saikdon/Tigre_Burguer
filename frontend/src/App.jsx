import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WhatsAppProvider } from './context/WhatsAppContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Tables from './pages/Tables';
import NewOrder from './pages/NewOrder';
import MesaOrder from './pages/MesaOrder';
import CashRegister from './pages/CashRegister';
import Reports from './pages/Reports';
import Reservations from './pages/Reservations';
import WhatsApp from './pages/WhatsApp';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
        <div className="spinner-border" style={{ color: 'var(--accent)' }} role="status"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
        <div className="spinner-border" style={{ color: 'var(--accent)' }} role="status"></div>
      </div>
    );
  }

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<Products />} />
        <Route path="categorias" element={<Categories />} />
        <Route path="mesas" element={<Tables />} />
        <Route path="mesa/:mesaId" element={<MesaOrder />} />
        <Route path="nueva-orden" element={<NewOrder />} />
        <Route path="caja" element={<CashRegister />} />
        <Route path="reportes" element={<Reports />} />
        <Route path="reservas" element={<Reservations />} />
        <Route path="whatsapp" element={<WhatsApp />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <WhatsAppProvider>
          <AppRoutes />
        </WhatsAppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
