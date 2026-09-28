import React, { useEffect, useState } from 'react';
import { projectAPI } from '../services/api';
import { formatCurrency, formatDate } from '../services/format';
import './ProjectsPage.css';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    budget: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await projectAPI.update(editingId, formData);
      } else {
        await projectAPI.create(formData);
      }
      setFormData({
        name: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        budget: ''
      });
      setEditingId(null);
      setShowForm(false);
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleEdit = (project) => {
    setFormData(project);
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectAPI.delete(id);
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  if (loading) {
    return <div className="container"><div className="spinner"></div></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Projects</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h2>{editingId ? 'Edit Project' : 'Add New Project'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Budget</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>
            </div>

            <button type="submit">{editingId ? 'Update Project' : 'Create Project'}</button>
          </form>
        </div>
      )}

      <div className="projects-list">
        {projects.length > 0 ? (
          projects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.name}</h3>
                <span className="project-budget">{formatCurrency(project.budget)}</span>
              </div>
              {project.location && <p className="project-location">📍 {project.location}</p>}
              {project.description && <p>{project.description}</p>}
              <div className="project-dates">
                {project.start_date && <span>Start: {formatDate(project.start_date)}</span>}
                {project.end_date && <span>End: {formatDate(project.end_date)}</span>}
              </div>
              <div className="project-actions">
                <button onClick={() => handleEdit(project)}>Edit</button>
                <button onClick={() => handleDelete(project.id)} className="danger">Delete</button>
              </div>
            </div>
          ))
        ) : (
          <p>No projects yet. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}

export default ProjectsPage;
