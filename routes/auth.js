const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db/connection');
const { isGuest } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/mailer');

// GET /auth/login
router.get('/login', isGuest, (req, res) => {
  res.render('auth/login', {
    title: 'Login – VolunteerHub',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// POST /auth/login
router.post('/login', isGuest, async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    res.redirect('/volunteer/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/auth/login');
  }
});

// GET /auth/register
router.get('/register', isGuest, (req, res) => {
  res.render('auth/register', {
    title: 'Register – VolunteerHub',
    error: req.flash('error')
  });
});

// POST /auth/register
router.post('/register', isGuest, async (req, res) => {
  const { name, email, password, phone, age, skills, availability } = req.body;
  try {
    // Check if email exists
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      req.flash('error', 'This email is already registered.');
      return res.redirect('/auth/register');
    }

    const hashed = await bcrypt.hash(password, 10);
    const [userResult] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, 'volunteer']
    );

    const skillsArray = Array.isArray(skills) ? skills.join(',') : skills;
    await db.execute(
      'INSERT INTO volunteers (user_id, phone, age, skills, availability, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userResult.insertId, phone, age, skillsArray, availability, 'pending']
    );

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name);

    req.flash('success', 'Registration successful! Please login.');
    res.redirect('/auth/success');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/auth/register');
  }
});

// GET /auth/success
router.get('/success', (req, res) => {
  res.render('auth/success', { title: 'Registration Successful – VolunteerHub' });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/auth/login'));
});

module.exports = router;