import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Trips', path: '/trips', icon: 'route' },
    { name: 'Vehicles', path: '/vehicles', icon: 'directions_bus' },
    { name: 'Drivers', path: '/drivers', icon: 'person' },
    { name: 'Fuel & Expenses', path: '/fuel-expenses', icon: 'local_gas_station' },
    { name: 'Maintenance', path: '/maintenance', icon: 'settings_applications' },
    { name: 'Reports', path: '/reports', icon: 'assessment' },
  ];

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full w-[240px] flex flex-col bg-surface border-r border-outline-variant transition-colors duration-200 ease-in-out z-50">
        <div className="p-gutter flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-container rounded flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              directions_bus
            </span>
          </div>
          <div>
            <h1 className="font-headline text-headline text-primary font-bold">TransitOps</h1>
            <p className="text-[10px] font-label-sm text-secondary uppercase tracking-widest">Enterprise Logistics</p>
          </div>
        </div>
        
        <nav className="mt-4 flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                  isActive
                    ? 'bg-surface-container-high text-primary border-l-4 border-primary font-semibold'
                    : 'text-secondary hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className="font-body-md">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto border-t border-outline-variant p-2">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-2 text-secondary hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-body-md">Settings</span>
          </a>
          <a
            href="#"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-secondary hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-body-md">Logout</span>
          </a>
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="fixed top-0 right-0 w-[calc(100%-240px)] h-navbar_height bg-surface flex items-center justify-between px-gutter border-b border-outline-variant z-40">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search transactions, vehicles, logs..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-1.5 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 text-secondary hover:bg-surface-container-low rounded-full transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-label-md font-bold text-on-surface">{user?.name || 'User'}</p>
              <p className="text-[10px] text-secondary">{user?.role || 'Operator'}</p>
            </div>
            <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-on-primary font-bold text-label-md">
              {(user?.name || 'OP').substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-[240px] mt-navbar_height p-container_padding bg-background min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default Layout;
