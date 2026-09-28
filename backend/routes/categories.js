const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Database = require('../db/database');

const db = new Database();
db.initialize();

// Get all categories
router.get('/', auth, async (req, res) => {
  try {
    const categories = await db.all(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC',
      [req.userId]
    );
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create category
router.post('/', auth, async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = await db.run(
      'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)',
      [req.userId, name, color]
    );

    res.status(201).json({
      id: result.id,
      message: 'Category created successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update category
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, color } = req.body;

    const category = await db.get(
      'SELECT * FROM categories WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await db.run(
      'UPDATE categories SET name = ?, color = ? WHERE id = ?',
      [name, color, req.params.id]
    );

    res.json({ message: 'Category updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await db.get(
      'SELECT * FROM categories WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
