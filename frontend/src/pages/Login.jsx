import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-surface border border-outline-variant p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-white mb-3">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              directions_bus
            </span>
          </div>
          <h1 className="font-display text-display text-primary font-bold">TransitOps</h1>
          <p className="text-xs uppercase tracking-widest text-secondary font-semibold mt-1">Enterprise Logistics</p>
        </div>

        <h2 className="text-title-md font-bold text-on-surface mb-6 text-center">Sign in to your account</h2>

        {error && (
          <div className="bg-error-container/20 border border-error/20 text-error p-3 rounded text-body-sm mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-label-md font-bold text-secondary uppercase">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. fleetmanager1@transitops.com"
              className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-body-md text-body-md"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-label-md font-bold text-secondary uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-body-md text-body-md"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary text-white font-bold rounded hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-body-sm text-secondary">
          <p>Demo accounts (Password: <span className="font-code">password123</span>):</p>
          <ul className="mt-2 space-y-1 font-code text-xs text-left bg-surface-container p-3 rounded border border-outline-variant">
            <li>• FM: <span className="font-bold">fleetmanager1@transitops.com</span></li>
            <li>• Driver: <span className="font-bold">driver1@transitops.com</span></li>
            <li>• Safety: <span className="font-bold">safetyofficer1@transitops.com</span></li>
            <li>• Analyst: <span className="font-bold">financialanalyst1@transitops.com</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
