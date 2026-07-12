import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import ThemeToggle from './ui/ThemeToggle';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [depotName, setDepotName] = useState('Enterprise Logistics');
  const searchRef = useRef(null);

  useEffect(() => {
    const updateDepotName = () => {
      const savedDepot = localStorage.getItem('settings_depot_name');
      if (savedDepot) {
        setDepotName(savedDepot);
      } else {
        setDepotName('Enterprise Logistics');
      }
    };
    
    updateDepotName();
    window.addEventListener('settingsChanged', updateDepotName);
    return () => window.removeEventListener('settingsChanged', updateDepotName);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const response = await client.get(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [searchQuery]);

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
            <p className="text-[10px] font-label-sm text-secondary uppercase tracking-widest truncate max-w-[160px]" title={depotName}>
              {depotName}
            </p>
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
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
              location.pathname === '/settings'
                ? 'bg-surface-container-high text-primary border-l-4 border-primary font-semibold'
                : 'text-secondary hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-body-md">Settings</span>
          </Link>
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
          <div ref={searchRef} className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search transactions, vehicles, logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-1.5 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            {isOpen && loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
              </div>
            )}
            {isOpen && searchResults && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-outline-variant rounded-lg shadow-xl max-h-[400px] overflow-y-auto z-50 divide-y divide-outline-variant">
                {/* Vehicles section */}
                {searchResults.vehicles?.length > 0 && (
                  <div className="p-3">
                    <h4 className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Vehicles</h4>
                    <ul className="space-y-1">
                      {searchResults.vehicles.map((v) => (
                        <li key={v.id}>
                          <button
                            onClick={() => {
                              navigate('/vehicles');
                              setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-surface-container rounded text-body-sm transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-on-surface">{v.name_model}</p>
                              <p className="text-xs text-secondary">{v.registration_number} • {v.type}</p>
                            </div>
                            <span className="text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded uppercase font-semibold">
                              {v.status}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Drivers section */}
                {searchResults.drivers?.length > 0 && (
                  <div className="p-3">
                    <h4 className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Drivers</h4>
                    <ul className="space-y-1">
                      {searchResults.drivers.map((d) => (
                        <li key={d.id}>
                          <button
                            onClick={() => {
                              navigate('/drivers');
                              setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-surface-container rounded text-body-sm transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-on-surface">{d.name}</p>
                              <p className="text-xs text-secondary">Lic: {d.license_number} • {d.contact_number}</p>
                            </div>
                            <span className="text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded uppercase font-semibold">
                              {d.status}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Trips section */}
                {searchResults.trips?.length > 0 && (
                  <div className="p-3">
                    <h4 className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Trips</h4>
                    <ul className="space-y-1">
                      {searchResults.trips.map((t) => (
                        <li key={t.id}>
                          <button
                            onClick={() => {
                              navigate('/trips');
                              setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-surface-container rounded text-body-sm transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-on-surface">{t.trip_number}</p>
                              <p className="text-xs text-secondary">{t.source} → {t.destination}</p>
                            </div>
                            <span className="text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded uppercase font-semibold">
                              {t.status}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Maintenance section */}
                {searchResults.maintenance?.length > 0 && (
                  <div className="p-3">
                    <h4 className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Maintenance Logs</h4>
                    <ul className="space-y-1">
                      {searchResults.maintenance.map((m) => (
                        <li key={m.id}>
                          <button
                            onClick={() => {
                              navigate('/maintenance');
                              setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-surface-container rounded text-body-sm transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-on-surface">{m.vehicle?.name_model || 'Vehicle'}</p>
                              <p className="text-xs text-secondary truncate max-w-[280px]">{m.description}</p>
                            </div>
                            <span className="text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded uppercase font-semibold">
                              {m.status}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* No results placeholder */}
                {!(
                  searchResults.vehicles?.length > 0 ||
                  searchResults.drivers?.length > 0 ||
                  searchResults.trips?.length > 0 ||
                  searchResults.maintenance?.length > 0
                ) && (
                  <div className="p-4 text-center text-secondary text-body-sm">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle size="sm" />
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
