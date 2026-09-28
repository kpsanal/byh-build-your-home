import React, { useEffect, useState } from 'react';
import { projectAPI, expenseAPI, reportAPI } from '../services/api';
import { formatCurrency, formatDate } from '../services/format';
import './Dashboard.css';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [projectSummary, setProjectSummary] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsRes, expensesRes, summaryRes] = await Promise.all([
        projectAPI.getAll(),
        expenseAPI.getAll(),
        reportAPI.getProjectSummary()
      ]);

      setProjects(projectsRes.data);
      setExpenses(expensesRes.data);
      setProjectSummary(summaryRes.data);

      const total = expensesRes.data.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalExpenses(total);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="spinner"></div></div>;
  }

  const budgetVsSpent = projectSummary.map(p => ({
    name: p.name,
    budget: p.budget || 0,
    spent: p.total_spent || 0
  }));

  return (
    <div className="container">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Expenses</h3>
          <p className="stat-value">{formatCurrency(totalExpenses)}</p>
          <span className="stat-label">{expenses.length} transactions</span>
        </div>

        <div className="stat-card">
          <h3>Active Projects</h3>
          <p className="stat-value">{projects.length}</p>
          <span className="stat-label">Projects</span>
        </div>

        <div className="stat-card">
          <h3>Average Expense</h3>
          <p className="stat-value">
            {formatCurrency(expenses.length > 0 ? totalExpenses / expenses.length : 0)}
          </p>
          <span className="stat-label">Per transaction</span>
        </div>

        <div className="stat-card">
          <h3>Recent Expense</h3>
          <p className="stat-value">
            {formatCurrency(expenses.length > 0 ? expenses[0].amount : 0)}
          </p>
          <span className="stat-label">Latest entry</span>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="dashboard-card">
          <h2>Recent Expenses</h2>
          {expenses.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 5).map(exp => (
                  <tr key={exp.id}>
                    <td>{exp.vendor || 'N/A'}</td>
                    <td>{formatCurrency(exp.amount)}</td>
                    <td>{formatDate(exp.date)}</td>
                    <td>{exp.description || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No expenses yet</p>
          )}
        </div>

        <div className="dashboard-card">
          <h2>Project Budget Status</h2>
          {budgetVsSpent.length > 0 ? (
            <div className="budget-list">
              {budgetVsSpent.map(project => (
                <div key={project.name} className="budget-item">
                  <h4>{project.name}</h4>
                  <div className="budget-bar">
                    <div 
                      className="budget-spent"
                      style={{width: `${Math.min(100, (project.spent / project.budget) * 100)}%`}}
                    ></div>
                  </div>
                  <p className="budget-text">
                    {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>No projects yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
