import React, { useEffect, useState } from 'react';
import { reportAPI, projectAPI } from '../services/api';
import { formatCurrency } from '../services/format';
import './ReportsPage.css';

function ReportsPage() {
  const [summary, setSummary] = useState({
    category: [],
    project: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [categoryRes, projectRes] = await Promise.all([
        reportAPI.getCategorySummary(),
        reportAPI.getProjectSummary()
      ]);
      setSummary({
        category: categoryRes.data,
        project: projectRes.data
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="spinner"></div></div>;
  }

  const totalByCategory = summary.category.reduce((sum, cat) => sum + (cat.total || 0), 0);
  const totalByProject = summary.project.reduce((sum, proj) => sum + (proj.total_spent || 0), 0);

  return (
    <div className="container">
      <h1>Reports & Analytics</h1>

      <div className="reports-grid">
        <div className="card">
          <h2>Expenses by Category</h2>
          {summary.category.length > 0 ? (
            <div className="category-chart">
              {summary.category.map(cat => (
                <div key={cat.id} className="chart-item">
                  <div className="chart-label">
                    <span className="category-dot" style={{backgroundColor: cat.color || '#667eea'}}></span>
                    <span>{cat.name}</span>
                  </div>
                  <div className="chart-bar">
                    <div 
                      className="chart-value"
                      style={{width: `${(cat.total / totalByCategory) * 100}%`, backgroundColor: cat.color || '#667eea'}}
                    ></div>
                  </div>
                  <div className="chart-stats">
                    <span>{formatCurrency(cat.total)}</span>
                    <span>{cat.count || 0} items</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No data available</p>
          )}
        </div>

        <div className="card">
          <h2>Project Budget Analysis</h2>
          {summary.project.length > 0 ? (
            <div className="project-analysis">
              {summary.project.map(proj => {
                const percentage = proj.budget ? (proj.total_spent / proj.budget) * 100 : 0;
                const status = percentage > 100 ? 'over-budget' : percentage > 80 ? 'warning' : 'good';
                return (
                  <div key={proj.id} className={`project-item ${status}`}>
                    <div className="project-info">
                      <h4>{proj.name}</h4>
                      <p>Budget: {formatCurrency(proj.budget)}</p>
                    </div>
                    <div className="project-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${status}`}
                          style={{width: `${Math.min(100, percentage)}%`}}
                        ></div>
                      </div>
                      <div className="progress-text">
                        <span>{formatCurrency(proj.total_spent)}</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Summary</h2>
        <div className="summary-stats">
          <div className="summary-item">
            <label>Total Expenses</label>
            <p>{formatCurrency(Math.max(totalByCategory, totalByProject))}</p>
          </div>
          <div className="summary-item">
            <label>Total Budget</label>
            <p>{formatCurrency(summary.project.reduce((sum, p) => sum + (Number(p.budget) || 0), 0))}</p>
          </div>
          <div className="summary-item">
            <label>Categories</label>
            <p>{summary.category.length}</p>
          </div>
          <div className="summary-item">
            <label>Projects</label>
            <p>{summary.project.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
