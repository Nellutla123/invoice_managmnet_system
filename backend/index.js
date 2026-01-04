const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalid' });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ message: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
    const info = stmt.run(email, hashedPassword, name);
    res.status(201).json({ id: info.lastInsertRowid, message: 'User created' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Invoice Routes
app.get('/api/invoices', authenticateToken, (req, res) => {
  const invoices = db.prepare('SELECT * FROM invoices WHERE user_id = ?').all(req.user.id);
  res.json(invoices);
});

app.post('/api/invoices', authenticateToken, (req, res) => {
  const { invoice_number, client_name, date, amount, status } = req.body;
  if (!invoice_number || !client_name || !date || !amount || !status) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO invoices (invoice_number, client_name, date, amount, status, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(invoice_number, client_name, date, amount, status, req.user.id);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Invoice created' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ message: 'Invoice number must be unique' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/invoices/:id', authenticateToken, (req, res) => {
  const { invoice_number, client_name, date, amount, status } = req.body;
  const { id } = req.params;

  try {
    const stmt = db.prepare(`
      UPDATE invoices 
      SET invoice_number = ?, client_name = ?, date = ?, amount = ?, status = ?
      WHERE id = ? AND user_id = ?
    `);
    const info = stmt.run(invoice_number, client_name, date, amount, status, id, req.user.id);

    if (info.changes === 0) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice updated' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/invoices/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?');
  const info = stmt.run(id, req.user.id);

  if (info.changes === 0) return res.status(404).json({ message: 'Invoice not found' });
  res.json({ message: 'Invoice deleted' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
