import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import client from '../api/client';
import { ArrowLeft, Save } from 'lucide-react';

const InvoiceForm = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    invoice_number: '',
    client_name: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    status: 'Pending'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && state?.invoice) {
      setFormData(state.invoice);
    } else if (isEdit) {
      // Fetch if state is missing
      client.get('/invoices').then(({ data }) => {
        const inv = data.find(i => i.id === parseInt(id));
        if (inv) setFormData(inv);
      });
    }
  }, [id, isEdit, state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        await client.put(`/invoices/${id}`, formData);
      } else {
        await client.post('/invoices', formData);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invoice-form-container">
      <header className="form-header">
        <button onClick={() => navigate('/')} className="btn-back">
          <ArrowLeft size={18} /> Back
        </button>
        <h1>{isEdit ? 'Edit Invoice' : 'Create New Invoice'}</h1>
      </header>

      <form className="invoice-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-grid">
          <div className="form-group">
            <label>Invoice Number</label>
            <input 
              type="text" 
              name="invoice_number" 
              value={formData.invoice_number} 
              onChange={handleChange} 
              required 
              placeholder="INV-001"
            />
          </div>

          <div className="form-group">
            <label>Client Name</label>
            <input 
              type="text" 
              name="client_name" 
              value={formData.client_name} 
              onChange={handleChange} 
              required 
              placeholder="Client/Company Name"
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Amount ($)</label>
            <input 
              type="number" 
              name="amount" 
              step="0.01"
              value={formData.amount} 
              onChange={handleChange} 
              required 
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
