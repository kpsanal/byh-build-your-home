import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { materialAPI, projectAPI, scheduleAPI } from '../services/api';
import { formatCurrency, formatDate } from '../services/format';
import './PlanPage.css';

const emptyMaterial = {
  project_id: '',
  name: '',
  quantity: '',
  unit: 'pieces',
  unit_cost: '',
  vendor: '',
  status: 'planned',
  needed_by: ''
};

const emptyTask = {
  project_id: '',
  title: '',
  description: '',
  start_date: '',
  due_date: '',
  status: 'not_started'
};

function PlanPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [materials, setMaterials] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    projectAPI.getAll()
      .then(({ data }) => setProjects(data))
      .catch(() => setError('Projects could not be loaded. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      materialAPI.getAll(selectedProject),
      scheduleAPI.getAll(selectedProject)
    ]).then(([materialResponse, taskResponse]) => {
      if (cancelled) return;
      setMaterials(materialResponse.data);
      setTasks(taskResponse.data);
      setError('');
    }).catch(() => {
      if (!cancelled) setError('Your build plan could not be loaded. Please try again.');
    });

    return () => { cancelled = true; };
  }, [selectedProject]);

  const refreshPlan = async () => {
    const [materialResponse, taskResponse] = await Promise.all([
      materialAPI.getAll(selectedProject),
      scheduleAPI.getAll(selectedProject)
    ]);
    setMaterials(materialResponse.data);
    setTasks(taskResponse.data);
  };

  const submitMaterial = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...materialForm,
      quantity: Number(materialForm.quantity),
      unit_cost: Number(materialForm.unit_cost || 0)
    };

    try {
      if (editingMaterial) await materialAPI.update(editingMaterial, payload);
      else await materialAPI.create(payload);
      setMaterialForm(emptyMaterial);
      setEditingMaterial(null);
      setShowMaterialForm(false);
      await refreshPlan();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not save this material. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const submitTask = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingTask) await scheduleAPI.update(editingTask, taskForm);
      else await scheduleAPI.create(taskForm);
      setTaskForm(emptyTask);
      setEditingTask(null);
      setShowTaskForm(false);
      await refreshPlan();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not save this timeline task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const editMaterial = (material) => {
    setMaterialForm({
      project_id: String(material.project_id),
      name: material.name,
      quantity: String(material.quantity),
      unit: material.unit,
      unit_cost: String(material.unit_cost),
      vendor: material.vendor || '',
      status: material.status,
      needed_by: material.needed_by || ''
    });
    setEditingMaterial(material.id);
    setShowMaterialForm(true);
  };

  const editTask = (task) => {
    setTaskForm({
      project_id: String(task.project_id),
      title: task.title,
      description: task.description || '',
      start_date: task.start_date || '',
      due_date: task.due_date || '',
      status: task.status
    });
    setEditingTask(task.id);
    setShowTaskForm(true);
  };

  const deleteRecord = async (api, id, label) => {
    if (!window.confirm(`Delete this ${label}?`)) return;
    setError('');
    try {
      await api.delete(id);
      await refreshPlan();
    } catch (requestError) {
      setError(requestError.response?.data?.error || `Could not delete this ${label}.`);
    }
  };

  const updateMaterialForm = (event) => {
    const { name, value } = event.target;
    setMaterialForm((current) => ({ ...current, [name]: value }));
  };

  const updateTaskForm = (event) => {
    const { name, value } = event.target;
    setTaskForm((current) => ({ ...current, [name]: value }));
  };

  if (loading) return <main className="container"><div className="spinner" /></main>;

  if (!projects.length) {
    return (
      <main className="container plan-page">
        <header className="plan-heading">
          <p className="plan-eyebrow">YOUR HOME, STEP BY STEP</p>
          <h1>Build plan</h1>
        </header>
        <section className="plan-empty">
          <h2>Start with a home project</h2>
          <p>Create a project before adding materials or construction dates.</p>
          <Link className="plan-primary-link" to="/projects">Create a project</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container plan-page">
      <header className="plan-heading">
        <div>
          <p className="plan-eyebrow">YOUR HOME, STEP BY STEP</p>
          <h1>Build plan</h1>
          <p className="plan-subtitle">Keep material purchases and construction dates in one place.</p>
        </div>
        <label className="plan-project-filter">
          <span>Show project</span>
          <select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}>
            <option value="">All projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
      </header>

      {error && <div className="plan-alert" role="alert">{error}</div>}

      <section className="plan-section" aria-labelledby="materials-title">
        <div className="plan-section-heading">
          <div>
            <p className="plan-eyebrow">BUYING & DELIVERY</p>
            <h2 id="materials-title">Materials</h2>
          </div>
          <button type="button" onClick={() => {
            setMaterialForm({ ...emptyMaterial, project_id: selectedProject || '' });
            setEditingMaterial(null);
            setShowMaterialForm((showing) => !showing);
          }}>{showMaterialForm ? 'Close form' : '+ Add material'}</button>
        </div>

        {showMaterialForm && (
          <form className="plan-form" onSubmit={submitMaterial}>
            <label>Project
              <select name="project_id" value={materialForm.project_id} onChange={updateMaterialForm} required>
                <option value="">Choose a project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label>Material
              <input name="name" value={materialForm.name} onChange={updateMaterialForm} placeholder="e.g. Cement" required />
            </label>
            <label>Quantity
              <input name="quantity" type="number" min="0.001" step="0.001" value={materialForm.quantity} onChange={updateMaterialForm} required />
            </label>
            <label>Unit
              <select name="unit" value={materialForm.unit} onChange={updateMaterialForm}>
                <option value="pieces">Pieces</option>
                <option value="bags">Bags</option>
                <option value="kg">Kg</option>
                <option value="tonnes">Tonnes</option>
                <option value="cubic metres">Cubic metres</option>
                <option value="sq ft">Sq ft</option>
                <option value="litres">Litres</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Cost per unit (₹)
              <input name="unit_cost" type="number" min="0" step="0.01" value={materialForm.unit_cost} onChange={updateMaterialForm} />
            </label>
            <label>Supplier
              <input name="vendor" value={materialForm.vendor} onChange={updateMaterialForm} />
            </label>
            <label>Needed by
              <input name="needed_by" type="date" value={materialForm.needed_by} onChange={updateMaterialForm} />
            </label>
            <label>Order status
              <select name="status" value={materialForm.status} onChange={updateMaterialForm}>
                <option value="planned">Planned</option>
                <option value="ordered">Ordered</option>
                <option value="delivered">Delivered</option>
              </select>
            </label>
            <div className="plan-form-actions">
              <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingMaterial ? 'Save changes' : 'Add material'}</button>
              <button type="button" className="plan-secondary-button" onClick={() => {
                setShowMaterialForm(false);
                setEditingMaterial(null);
                setMaterialForm(emptyMaterial);
              }}>Cancel</button>
            </div>
          </form>
        )}

        {materials.length ? (
          <div className="plan-table-wrap">
            <table className="plan-table">
              <thead><tr><th>Material</th><th>Quantity</th><th>Needed by</th><th>Status</th><th>Estimate</th><th>Actions</th></tr></thead>
              <tbody>{materials.map((material) => (
                <tr key={material.id}>
                  <td><strong>{material.name}</strong><small>{material.project_name}{material.vendor ? ` · ${material.vendor}` : ''}</small></td>
                  <td>{Number(material.quantity).toLocaleString('en-IN')} {material.unit}</td>
                  <td>{formatDate(material.needed_by)}</td>
                  <td><span className={`plan-status status-${material.status}`}>{material.status}</span></td>
                  <td>{formatCurrency(Number(material.quantity) * Number(material.unit_cost))}</td>
                  <td className="plan-row-actions">
                    <button type="button" onClick={() => editMaterial(material)}>Edit</button>
                    <button type="button" className="plan-delete" onClick={() => deleteRecord(materialAPI, material.id, 'material')}>Delete</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="plan-no-rows">No materials planned yet.</p>}
      </section>

      <section className="plan-section" aria-labelledby="timeline-title">
        <div className="plan-section-heading">
          <div>
            <p className="plan-eyebrow">DATES & PROGRESS</p>
            <h2 id="timeline-title">Construction timeline</h2>
          </div>
          <button type="button" onClick={() => {
            setTaskForm({ ...emptyTask, project_id: selectedProject || '' });
            setEditingTask(null);
            setShowTaskForm((showing) => !showing);
          }}>{showTaskForm ? 'Close form' : '+ Add task'}</button>
        </div>

        {showTaskForm && (
          <form className="plan-form" onSubmit={submitTask}>
            <label>Project
              <select name="project_id" value={taskForm.project_id} onChange={updateTaskForm} required>
                <option value="">Choose a project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label>Task
              <input name="title" value={taskForm.title} onChange={updateTaskForm} placeholder="e.g. Foundation work" required />
            </label>
            <label>Start date
              <input name="start_date" type="date" value={taskForm.start_date} onChange={updateTaskForm} />
            </label>
            <label>Due date
              <input name="due_date" type="date" value={taskForm.due_date} onChange={updateTaskForm} required />
            </label>
            <label>Status
              <select name="status" value={taskForm.status} onChange={updateTaskForm}>
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label className="plan-description-field">Notes
              <textarea name="description" value={taskForm.description} onChange={updateTaskForm} rows="2" />
            </label>
            <div className="plan-form-actions">
              <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingTask ? 'Save changes' : 'Add task'}</button>
              <button type="button" className="plan-secondary-button" onClick={() => {
                setShowTaskForm(false);
                setEditingTask(null);
                setTaskForm(emptyTask);
              }}>Cancel</button>
            </div>
          </form>
        )}

        {tasks.length ? (
          <div className="plan-table-wrap">
            <table className="plan-table">
              <thead><tr><th>Task</th><th>Project</th><th>Start</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{tasks.map((task) => (
                <tr key={task.id}>
                  <td><strong>{task.title}</strong>{task.description && <small>{task.description}</small>}</td>
                  <td>{task.project_name}</td>
                  <td>{formatDate(task.start_date)}</td>
                  <td>{formatDate(task.due_date)}</td>
                  <td><span className={`plan-status status-${task.status}`}>{task.status.replace('_', ' ')}</span></td>
                  <td className="plan-row-actions">
                    <button type="button" onClick={() => editTask(task)}>Edit</button>
                    <button type="button" className="plan-delete" onClick={() => deleteRecord(scheduleAPI, task.id, 'task')}>Delete</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="plan-no-rows">No construction dates planned yet.</p>}
      </section>
    </main>
  );
}

export default PlanPage;