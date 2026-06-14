const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { isAuthenticated } = require('../middleware/auth');

// GET /volunteer/dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [volRows] = await db.execute(
      `SELECT v.*, u.name, u.email FROM volunteers v 
       JOIN users u ON v.user_id = u.id 
       WHERE v.user_id = ?`, [userId]
    );

    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    const [events] = await db.execute(
      `SELECT e.* FROM events e
       JOIN event_volunteers ev ON e.id = ev.event_id
       JOIN volunteers v ON v.id = ev.volunteer_id
       WHERE v.user_id = ?
       ORDER BY e.event_date DESC LIMIT 3`, [userId]
    );

    const volunteer = volRows[0] || null;

    res.render('volunteer/dashboard', {
      title: 'My Dashboard – VolunteerHub',
      user: req.session.user,
      volunteer,
      notifications,
      upcomingEvents: events,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error(err);
    res.render('volunteer/dashboard', {
      title: 'My Dashboard – VolunteerHub',
      user: req.session.user,
      volunteer: null,
      notifications: [],
      upcomingEvents: [],
      error: ['Could not load dashboard.'],
      success: []
    });
  }
});

// GET /volunteer/profile
router.get('/profile', isAuthenticated, async (req, res) => {
  const [rows] = await db.execute(
    `SELECT v.*, u.name, u.email FROM volunteers v 
     JOIN users u ON v.user_id = u.id WHERE v.user_id = ?`,
    [req.session.user.id]
  );
  res.render('volunteer/profile', {
    title: 'My Profile – VolunteerHub',
    user: req.session.user,
    volunteer: rows[0] || null,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// POST /volunteer/profile (update)
router.post('/profile', isAuthenticated, async (req, res) => {
  const { phone, age, skills, availability } = req.body;
  const skillsStr = Array.isArray(skills) ? skills.join(',') : skills;
  try {
    await db.execute(
      'UPDATE volunteers SET phone=?, age=?, skills=?, availability=? WHERE user_id=?',
      [phone, age, skillsStr, availability, req.session.user.id]
    );
    req.flash('success', 'Profile updated successfully!');
  } catch (err) {
    req.flash('error', 'Failed to update profile.');
  }
  res.redirect('/volunteer/profile');
});

// GET /volunteer/events
router.get('/events', isAuthenticated, async (req, res) => {
  const [events] = await db.execute(
    'SELECT * FROM events ORDER BY event_date ASC'
  );
  res.render('volunteer/events', {
    title: 'Events – VolunteerHub',
    user: req.session.user,
    events,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// POST /volunteer/events/:id/join
router.post('/events/:id/join', isAuthenticated, async (req, res) => {
  try {
    const [vol] = await db.execute('SELECT id FROM volunteers WHERE user_id = ?', [req.session.user.id]);
    if (!vol.length) {
      req.flash('error', 'Volunteer profile not found.');
      return res.redirect('/volunteer/events');
    }
    await db.execute(
      'INSERT IGNORE INTO event_volunteers (event_id, volunteer_id) VALUES (?, ?)',
      [req.params.id, vol[0].id]
    );
    req.flash('success', 'You have joined this event!');
  } catch (err) {
    req.flash('error', 'Could not join event.');
  }
  res.redirect('/volunteer/events');
});

module.exports = router;