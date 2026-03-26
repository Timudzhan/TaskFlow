const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const USERS_FILE = process.env.USERS_FILE || path.join(__dirname, 'users.json');

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf8');
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || [];
  } catch (e) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

app.get('/api/users', (req, res) => {
  res.json(readUsers());
});

app.post('/api/users', (req, res) => {
  const { name, email, pass } = req.body || {};
  if (!email || !pass) return res.status(400).json({ error: 'Missing fields' });
  const users = readUsers();
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email exists' });
  const user = { id: Date.now(), name: name || '', email, pass };
  users.push(user);
  writeUsers(users);
  res.status(201).json(user);
});

app.post('/api/auth', (req, res) => {
  const { email, pass } = req.body || {};
  if (!email || !pass) return res.status(400).json({ error: 'Missing fields' });
  const users = readUsers();
  const user = users.find(u => u.email === email && u.pass === pass);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json(user);
});

// Serve frontend static files from ../frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));
// Export app for testing; start server only when run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`TaskFlow backend listening on ${PORT}`));
} else {
  module.exports = app;
}
