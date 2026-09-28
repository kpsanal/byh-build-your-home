const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Database = require('../db/database');

const db = new Database();

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await db.all(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await db.get(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, location, start_date, end_date, budget } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const result = await db.run(
      'INSERT INTO projects (user_id, name, description, location, start_date, end_date, budget) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, name, description, location, start_date, end_date, budget]
    );

    res.status(201).json({
      id: result.id,
      message: 'Project created successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, location, start_date, end_date, budget } = req.body;

    const project = await db.get(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db.run(
      'UPDATE projects SET name = ?, description = ?, location = ?, start_date = ?, end_date = ?, budget = ? WHERE id = ? AND user_id = ?',
      [name, description, location, start_date, end_date, budget, req.params.id, req.userId]
    );

    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await db.get(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db.run('DELETE FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
