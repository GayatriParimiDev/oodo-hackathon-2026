require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const tripRoutes = require('./routes/trips');
const maintenanceRoutes = require('./routes/maintenance');
const dashboardRoutes = require('./routes/dashboard');
const fuelLogRoutes = require('./routes/fuelLogs');
const expenseRoutes = require('./routes/expenses');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Logging middleware (optional but useful)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fuel-logs', fuelLogRoutes);
app.use('/api/expenses', expenseRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'TransitOps Backend API is running.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TransitOps Backend Server is listening on port ${PORT}`);
});
