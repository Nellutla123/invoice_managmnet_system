import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Edit, LogOut } from 'lucide-react';

const Dashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    let result = invoices.filter(inv => 
      inv.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'All') {
      result = result.filter(inv => inv.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'amount') return b.amount - a.amount;
      return 0;
    });

    setFilteredInvoices(result);
  }, [searchTerm, statusFilter, sortBy, invoices]);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchInvoices = async () => {
    try {
      const { data } = await client.get('/invoices');
      setInvoices(data);
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/invoices/${id}`);
      setInvoices(invoices.filter(inv => inv.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="user-info">
          <h2>Welcome, {user.name}</h2>
          <p>You have {invoices.length} total invoices</p>
        </div>
        <div className="header-actions">
          <Link to="/invoice/new" className="btn btn-primary">
            <Plus size={18} /> New Invoice
          </Link>
          <button onClick={logout} className="btn-icon">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by client or number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Pending">Pending</option>
          </select>
          
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>

      <div className="invoice-list">
        {filteredInvoices.length === 0 ? (
          <div className="empty-state">No invoices found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv.id}>
                  <td><strong>{inv.invoice_number}</strong></td>
                  <td>{inv.client_name}</td>
                  <td>{new Date(inv.date).toLocaleDateString()}</td>
                  <td>${inv.amount.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${inv.status.toLowerCase()}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {deleteConfirmId === inv.id ? (
                      <div className="delete-confirmation-inline">
                        <button onClick={() => handleDelete(inv.id)} className="btn-confirm-delete">Confirm</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="btn-cancel-delete">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => navigate(`/invoice/edit/${inv.id}`, { state: { invoice: inv } })} className="btn-edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setDeleteConfirmId(inv.id)} className="btn-delete">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
