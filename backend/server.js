const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const Database = require('./db/database');
const db = new Database();
db.initialize();

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
