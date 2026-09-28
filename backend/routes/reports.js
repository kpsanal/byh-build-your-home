const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Database = require('../db/database');

const db = new Database();
db.initialize();

// Get expense summary by category
router.get('/summary/category', auth, async (req, res) => {
  try {
    const summary = await db.all(`
      SELECT 
        c.id,
        c.name,
        c.color,
        SUM(e.amount) as total,
        COUNT(e.id) as count
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = ?
      WHERE c.user_id = ?
      GROUP BY c.id
    `, [req.userId, req.userId]);

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get expense summary by project
router.get('/summary/project', auth, async (req, res) => {
  try {
    const summary = await db.all(`
      SELECT 
        p.id,
        p.name,
        p.budget,
        SUM(e.amount) as total_spent,
        COUNT(e.id) as expense_count
      FROM projects p
      LEFT JOIN expenses e ON p.id = e.project_id AND e.user_id = ?
      WHERE p.user_id = ?
      GROUP BY p.id
    `, [req.userId, req.userId]);

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get total expenses for date range
router.get('/summary/date-range', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const summary = await db.get(`
      SELECT 
        SUM(amount) as total_amount,
        COUNT(id) as total_expenses,
        AVG(amount) as average_expense
      FROM expenses
      WHERE user_id = ?
      AND date BETWEEN ? AND ?
    `, [req.userId, startDate, endDate]);

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get monthly expense trend
router.get('/trend/monthly', auth, async (req, res) => {
  try {
    const trend = await db.all(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total
      FROM expenses
      WHERE user_id = ?
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT 12
    `, [req.userId]);

    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
