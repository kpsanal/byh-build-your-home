const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Database = require('../db/database');

const db = new Database();

const allowedStatuses = new Set(['planned', 'ordered', 'delivered']);

router.get('/', auth, async (req, res) => {
  try {
    const { project_id: projectId } = req.query;
    const params = [req.userId];
    let projectFilter = '';

    if (projectId) {
      projectFilter = ' AND m.project_id = ?';
      params.push(projectId);
    }

    const materials = await db.all(`
      SELECT m.*, p.name AS project_name
      FROM materials m
      JOIN projects p ON p.id = m.project_id AND p.user_id = m.user_id
      WHERE m.user_id = ?${projectFilter}
      ORDER BY m.needed_by ASC, m.created_at DESC
    `, params);
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load materials' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { project_id: projectId, name, quantity, unit, unit_cost: unitCost = 0, vendor, status = 'planned', needed_by: neededBy } = req.body;
    const numericQuantity = Number(quantity);
    const numericUnitCost = Number(unitCost);

    if (!Number.isInteger(Number(projectId)) || !name?.trim() || !unit?.trim() || !Number.isFinite(numericQuantity) || numericQuantity <= 0 || !Number.isFinite(numericUnitCost) || numericUnitCost < 0 || !allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Enter a material, positive quantity, unit, valid cost, and status' });
    }

    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, req.userId]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await db.run(
      'INSERT INTO materials (user_id, project_id, name, quantity, unit, unit_cost, vendor, status, needed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, projectId, name.trim(), numericQuantity, unit.trim(), numericUnitCost, vendor?.trim() || null, status, neededBy || null]
    );
    res.status(201).json({ id: result.id, message: 'Material added' });
  } catch (error) {
    res.status(500).json({ error: 'Unable to add material' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, quantity, unit, unit_cost: unitCost = 0, vendor, status, needed_by: neededBy } = req.body;
    const numericQuantity = Number(quantity);
    const numericUnitCost = Number(unitCost);

    if (!name?.trim() || !unit?.trim() || !Number.isFinite(numericQuantity) || numericQuantity <= 0 || !Number.isFinite(numericUnitCost) || numericUnitCost < 0 || !allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Enter a material, positive quantity, unit, valid cost, and status' });
    }

    const result = await db.run(
      'UPDATE materials SET name = ?, quantity = ?, unit = ?, unit_cost = ?, vendor = ?, status = ?, needed_by = ? WHERE id = ? AND user_id = ?',
      [name.trim(), numericQuantity, unit.trim(), numericUnitCost, vendor?.trim() || null, status, neededBy || null, req.params.id, req.userId]
    );
    if (!result.changes) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json({ message: 'Material updated' });
  } catch (error) {
    res.status(500).json({ error: 'Unable to update material' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.run('DELETE FROM materials WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!result.changes) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json({ message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Unable to delete material' });
  }
});

module.exports = router;