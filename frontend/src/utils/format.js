export const getCurrencySymbol = () => {
  const currencySetting = localStorage.getItem('settings_currency') || 'INR (Rs)';
  if (currencySetting.includes('USD')) return '$';
  if (currencySetting.includes('EUR')) return '€';
  if (currencySetting.includes('GBP')) return '£';
  return '₹';
};

export const getDistanceUnit = () => {
  const unitSetting = localStorage.getItem('settings_distance_unit') || 'Kilometers';
  return unitSetting === 'Miles' ? 'mi' : 'km';
};

export const getFuelEfficiencyUnit = () => {
  const unitSetting = localStorage.getItem('settings_distance_unit') || 'Kilometers';
  return unitSetting === 'Miles' ? 'mpg' : 'km/L';
};

// Convert distance value from km to miles if set
export const convertDistance = (valInKm) => {
  const num = parseFloat(valInKm || 0);
  const unitSetting = localStorage.getItem('settings_distance_unit') || 'Kilometers';
  if (unitSetting === 'Miles') {
    return num * 0.621371;
  }
  return num;
};

// Convert fuel efficiency value from km/L to MPG if set
export const convertFuelEfficiency = (valInKmL) => {
  const num = parseFloat(valInKmL || 0);
  const unitSetting = localStorage.getItem('settings_distance_unit') || 'Kilometers';
  if (unitSetting === 'Miles') {
    return num * 2.35215;
  }
  return num;
};

// Formatting helpers
export const formatCurrency = (val) => {
  const symbol = getCurrencySymbol();
  const num = parseFloat(val || 0);
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDistance = (valInKm) => {
  const val = convertDistance(valInKm);
  const unit = getDistanceUnit();
  return `${val.toFixed(1)} ${unit}`;
};

export const formatFuelEfficiency = (valInKmL) => {
  const val = convertFuelEfficiency(valInKmL);
  const unit = getFuelEfficiencyUnit();
  return `${val.toFixed(1)} ${unit}`;
};
