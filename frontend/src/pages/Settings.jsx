import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [depotName, setDepotName] = useState('Gandhinagar Depot GJ4');
  const [currency, setCurrency] = useState('INR (Rs)');
  const [distanceUnit, setDistanceUnit] = useState('Kilometers');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const savedDepot = localStorage.getItem('settings_depot_name');
    const savedCurrency = localStorage.getItem('settings_currency');
    const savedUnit = localStorage.getItem('settings_distance_unit');

    if (savedDepot) setDepotName(savedDepot);
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedUnit) setDistanceUnit(savedUnit);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('settings_depot_name', depotName);
    localStorage.setItem('settings_currency', currency);
    localStorage.setItem('settings_distance_unit', distanceUnit);
    
    // Dispatch custom event to notify Layout.jsx of depot name changes
    window.dispatchEvent(new Event('settingsChanged'));

    setSavedMessage('Settings saved successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-outline-variant pb-4">
        <h2 className="font-display text-display text-on-surface">Settings &amp; Configuration</h2>
        <p className="font-body-md text-body-md text-secondary mt-1">
          Configure default localization settings, depot parameters, and regional parameters.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded text-body-sm">
          {savedMessage}
        </div>
      )}

      {/* Main Settings Form Card */}
      <div className="bg-white border border-outline-variant rounded p-6 max-w-xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h3 className="text-label-md font-label-md text-outline uppercase tracking-wider mb-4">General Parameters</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Depot Name</label>
                <input
                  type="text"
                  required
                  value={depotName}
                  onChange={(e) => setDepotName(e.target.value)}
                  placeholder="e.g. Gandhinagar Depot GJ4"
                  className="w-full h-10 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-surface text-on-surface"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-10 px-3 border border-outline-variant rounded text-body-md focus:outline-none focus:border-primary bg-surface text-on-surface"
                >
                  <option value="INR (Rs)">INR (Rs)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Distance Unit</label>
                <select
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value)}
                  className="w-full h-10 px-3 border border-outline-variant rounded text-body-md focus:outline-none focus:border-primary bg-surface text-on-surface"
                >
                  <option value="Kilometers">Kilometers (km)</option>
                  <option value="Miles">Miles (mi)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant">
            <button
              type="submit"
              className="h-10 px-8 bg-primary text-white font-label-md text-label-md hover:opacity-90 transition-all flex items-center justify-center rounded"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
