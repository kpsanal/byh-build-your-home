import React, { useEffect, useState } from 'react';
import { expenseAPI, projectAPI, categoryAPI } from '../services/api';
import './ExpensesPage.css';

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterProject, setFilterProject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState({
    project_id: '',
    category_id: '',
    amount: '',
    description: '',
    vendor: '',
    date: '',
    invoice_number: '',
    payment_method: 'cash'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesRes, projectsRes, categoriesRes] = await Promise.all([
        expenseAPI.getAll(),
        projectAPI.getAll(),
        categoryAPI.getAll()
      ]);
      setExpenses(expensesRes.data);
      setProjects(projectsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
        await expenseAPI.update(editingId, formData);
      } else {
        await expenseAPI.create(formData);
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      category_id: '',
      amount: '',
      description: '',
      vendor: '',
      date: '',
      invoice_number: '',
      payment_method: 'cash'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (expense) => {
    setFormData(expense);
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const getProjectName = (id) => {
    return projects.find(p => p.id === id)?.name || 'N/A';
  };

  const getCategoryName = (id) => {
    return categories.find(c => c.id === id)?.name || 'N/A';
  };

  const filteredExpenses = expenses.filter(exp => {
    if (filterProject && exp.project_id !== parseInt(filterProject)) return false;
    if (filterCategory && exp.category_id !== parseInt(filterCategory)) return false;
    return true;
  });

  if (loading) {
    return <div className="container"><div className="spinner"></div></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Expenses</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Expense'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h2>{editingId ? 'Edit Expense' : 'Add New Expense'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Project</label>
                <select name="project_id" value={formData.project_id} onChange={handleInputChange}>
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select name="category_id" value={formData.category_id} onChange={handleInputChange}>
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Vendor</label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select name="payment_method" value={formData.payment_method} onChange={handleInputChange}>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div className="form-group">
                <label>Invoice Number</label>
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
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

            <button type="submit">{editingId ? 'Update Expense' : 'Create Expense'}</button>
          </form>
        </div>
      )}

      <div className="filters-card">
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <h2>Expenses ({filteredExpenses.length})</h2>
        {filteredExpenses.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Project</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => (
                <tr key={exp.id}>
                  <td>{new Date(exp.date).toLocaleDateString()}</td>
                  <td>{exp.vendor || 'N/A'}</td>
                  <td className="amount">${exp.amount.toFixed(2)}</td>
                  <td>{getCategoryName(exp.category_id)}</td>
                  <td>{getProjectName(exp.project_id)}</td>
                  <td>{exp.payment_method || 'N/A'}</td>
                  <td>
                    <button className="action-btn" onClick={() => handleEdit(exp)}>Edit</button>
                    <button className="action-btn danger" onClick={() => handleDelete(exp.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No expenses found</p>
        )}
      </div>
    </div>
  );
}

export default ExpensesPage;
