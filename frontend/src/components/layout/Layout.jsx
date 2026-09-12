import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="d-flex" style={{ position: 'relative', minHeight: '100vh' }}>
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

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className="flex-grow-1"
        style={{
          marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '0',
          transition: 'margin-left 0.3s ease',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        <main
          className="p-4"
          style={{
            marginTop: 'var(--header-height)',
            minHeight: 'calc(100vh - var(--header-height))',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
