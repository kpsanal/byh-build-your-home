const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Database = require('./db/database');

const app = express();
const healthDb = new Database();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');
const reportRoutes = require('./routes/reports');
const materialRoutes = require('./routes/materials');
const scheduleRoutes = require('./routes/schedule');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/schedule', scheduleRoutes);

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/readyz', async (req, res) => {
  try {
    await healthDb.get('SELECT 1 AS ready');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not_ready' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
