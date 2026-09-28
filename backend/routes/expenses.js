const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Database = require('../db/database');

const db = new Database();

// Get all expenses
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await db.all(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC',
      [req.userId]
    );
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get expenses by project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const expenses = await db.all(
      'SELECT * FROM expenses WHERE user_id = ? AND project_id = ? ORDER BY date DESC',
      [req.userId, req.params.projectId]
    );
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create expense
router.post('/', auth, async (req, res) => {
  try {
    const { project_id, category_id, amount, description, vendor, date, invoice_number, payment_method } = req.body;

    if (!amount || !date) {
      return res.status(400).json({ error: 'Amount and date are required' });
    }

    if (project_id) {
      const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [project_id, req.userId]);
      if (!project) return res.status(400).json({ error: 'Select a project from your account' });
    }

    if (category_id) {
      const category = await db.get('SELECT id FROM categories WHERE id = ? AND user_id = ?', [category_id, req.userId]);
      if (!category) return res.status(400).json({ error: 'Select a category from your account' });
    }

    const result = await db.run(
      'INSERT INTO expenses (user_id, project_id, category_id, amount, description, vendor, date, invoice_number, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, project_id || null, category_id || null, amount, description, vendor, date, invoice_number, payment_method]
    );

    res.status(201).json({
      id: result.id,
      message: 'Expense created successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const { project_id, category_id, amount, description, vendor, date, invoice_number, payment_method } = req.body;

    const expense = await db.get(
      'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (project_id) {
      const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [project_id, req.userId]);
      if (!project) return res.status(400).json({ error: 'Select a project from your account' });
    }

    if (category_id) {
      const category = await db.get('SELECT id FROM categories WHERE id = ? AND user_id = ?', [category_id, req.userId]);
      if (!category) return res.status(400).json({ error: 'Select a category from your account' });
    }

    await db.run(
      'UPDATE expenses SET project_id = ?, category_id = ?, amount = ?, description = ?, vendor = ?, date = ?, invoice_number = ?, payment_method = ? WHERE id = ? AND user_id = ?',
      [project_id || null, category_id || null, amount, description, vendor, date, invoice_number, payment_method, req.params.id, req.userId]
    );

    res.json({ message: 'Expense updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await db.get(
      'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await db.run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
