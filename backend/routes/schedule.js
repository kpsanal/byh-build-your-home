const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Database = require('../db/database');

const db = new Database();

const allowedStatuses = new Set(['not_started', 'in_progress', 'done']);

router.get('/', auth, async (req, res) => {
  try {
    const { project_id: projectId } = req.query;
    const params = [req.userId];
    let projectFilter = '';

    if (projectId) {
      projectFilter = ' AND t.project_id = ?';
      params.push(projectId);
    }

    const tasks = await db.all(`
      SELECT t.*, p.name AS project_name
      FROM schedule_tasks t
      JOIN projects p ON p.id = t.project_id AND p.user_id = t.user_id
      WHERE t.user_id = ?${projectFilter}
      ORDER BY t.due_date ASC, t.created_at DESC
    `, params);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load project timeline' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { project_id: projectId, title, description, start_date: startDate, due_date: dueDate, status = 'not_started' } = req.body;

    if (!Number.isInteger(Number(projectId)) || !title?.trim() || !dueDate || (startDate && startDate > dueDate) || !allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Enter a task, valid dates, and status' });
    }

    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, req.userId]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await db.run(
      'INSERT INTO schedule_tasks (user_id, project_id, title, description, start_date, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, projectId, title.trim(), description?.trim() || null, startDate || null, dueDate, status]
    );
    res.status(201).json({ id: result.id, message: 'Timeline task added' });
  } catch (error) {
    res.status(500).json({ error: 'Unable to add timeline task' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, start_date: startDate, due_date: dueDate, status } = req.body;

    if (!title?.trim() || !dueDate || (startDate && startDate > dueDate) || !allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Enter a task, valid dates, and status' });
    }

    const result = await db.run(
      'UPDATE schedule_tasks SET title = ?, description = ?, start_date = ?, due_date = ?, status = ? WHERE id = ? AND user_id = ?',
      [title.trim(), description?.trim() || null, startDate || null, dueDate, status, req.params.id, req.userId]
    );
    if (!result.changes) {
      return res.status(404).json({ error: 'Timeline task not found' });
    }
    res.json({ message: 'Timeline task updated' });
  } catch (error) {
    res.status(500).json({ error: 'Unable to update timeline task' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.run('DELETE FROM schedule_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!result.changes) {
      return res.status(404).json({ error: 'Timeline task not found' });
    }
    res.json({ message: 'Timeline task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Unable to delete timeline task' });
  }
});

module.exports = router;