const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { isAdmin } = require('../middleware/auth');
const { sendStatusEmail } = require('../utils/mailer');
const { stringify } = require('csv-stringify');

// GET /admin/dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM volunteers');
    const [[{ newToday }]] = await db.execute(
      "SELECT COUNT(*) as newToday FROM volunteers WHERE DATE(created_at) = CURDATE()"
    );
    const [[{ approved }]] = await db.execute(
      "SELECT COUNT(*) as approved FROM volunteers WHERE status = 'approved'"
    );
    const [[{ pending }]] = await db.execute(
      "SELECT COUNT(*) as pending FROM volunteers WHERE status = 'pending'"
    );
    const [[{ rejected }]] = await db.execute(
      "SELECT COUNT(*) as rejected FROM volunteers WHERE status = 'rejected'"
    );

    // Skills distribution
    const [allSkills] = await db.execute('SELECT skills FROM volunteers');
    const skillCount = {};
    allSkills.forEach(r => {
      if (r.skills) r.skills.split(',').forEach(s => {
        const sk = s.trim();
        skillCount[sk] = (skillCount[sk] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Recent registrations
    const [recent] = await db.execute(
      `SELECT v.*, u.name, u.email FROM volunteers v 
       JOIN users u ON v.user_id = u.id 
       ORDER BY v.created_at DESC LIMIT 5`
    );


    // Monthly stats (last 6 months)
    const [monthly] = await db.execute(`
      SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as count
      FROM volunteers
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY MIN(created_at) ASC
    `);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard – VolunteerHub',
      user: req.session.user,
      stats: { total, newToday, approved, pending, rejected },
      topSkills,
      recentVolunteers: recent,
      monthly,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user,
      stats: {},
      topSkills: [],
      recentVolunteers: [],
      monthly: [],
      error: ['Dashboard load error.'],
      success: []
    });
  }
});

// GET /admin/volunteers
router.get('/volunteers', isAdmin, async (req, res) => {
  const { search, skill, status, sort } = req.query;
  let query = `
    SELECT v.*, u.name, u.email FROM volunteers v
    JOIN users u ON v.user_id = u.id WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (u.name LIKE ? OR u.email LIKE ? OR v.phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (skill) {
    query += ' AND v.skills LIKE ?';
    params.push(`%${skill}%`);
  }
  if (status) {
    query += ' AND v.status = ?';
    params.push(status);
  }

  const sortMap = {
    newest: 'v.created_at DESC',
    oldest: 'v.created_at ASC',
    name: 'u.name ASC'
  };
  query += ` ORDER BY ${sortMap[sort] || 'v.created_at DESC'}`;

  const [volunteers] = await db.execute(query, params);

  // Get unique skills for filter dropdown
  const [skillRows] = await db.execute('SELECT DISTINCT skills FROM volunteers WHERE skills IS NOT NULL');
  const allSkills = [...new Set(skillRows.flatMap(r => r.skills.split(',').map(s => s.trim())))].filter(Boolean);

  res.render('admin/volunteers', {
    title: 'Manage Volunteers – VolunteerHub',
    user: req.session.user,
    volunteers,
    allSkills,
    filters: { search, skill, status, sort },
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// GET /admin/volunteers/:id
router.get('/volunteers/:id', isAdmin, async (req, res) => {
  const [rows] = await db.execute(
    `SELECT v.*, u.name, u.email FROM volunteers v 
     JOIN users u ON v.user_id = u.id WHERE v.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.redirect('/admin/volunteers');

  const [logs] = await db.execute(
    `SELECT al.*, u.name as admin_name FROM activity_logs al
     LEFT JOIN users u ON al.admin_id = u.id
     WHERE al.target_volunteer_id = ? ORDER BY al.created_at DESC`,
    [req.params.id]
  );

  res.render('admin/volunteer-detail', {
    title: `${rows[0].name} – VolunteerHub`,
    user: req.session.user,
    volunteer: rows[0],
    logs,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// POST /admin/volunteers/:id/status
router.post('/volunteers/:id/status', isAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const [rows] = await db.execute(
      `SELECT v.*, u.name, u.email FROM volunteers v 
       JOIN users u ON v.user_id = u.id WHERE v.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.redirect('/admin/volunteers');

    await db.execute('UPDATE volunteers SET status = ? WHERE id = ?', [status, req.params.id]);

    // Log activity
    await db.execute(
      'INSERT INTO activity_logs (admin_id, action, target_volunteer_id, details) VALUES (?, ?, ?, ?)',
      [req.session.user.id, 'status_update', req.params.id, `Status changed to ${status}`]
    );

    // Send status email
    if (status === 'approved' || status === 'rejected') {
      sendStatusEmail(rows[0].email, rows[0].name, status);

      // Add notification
      await db.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [rows[0].user_id, `Your volunteer application has been ${status}.`]
      );
    }

    req.flash('success', `Status updated to ${status}.`);
  } catch (err) {
    req.flash('error', 'Failed to update status.');
  }
  res.redirect(`/admin/volunteers/${req.params.id}`);
});

// POST /admin/volunteers/:id/notes
router.post('/volunteers/:id/notes', isAdmin, async (req, res) => {
  const { notes } = req.body;
  try {
    await db.execute('UPDATE volunteers SET admin_notes = ? WHERE id = ?', [notes, req.params.id]);
    await db.execute(
      'INSERT INTO activity_logs (admin_id, action, target_volunteer_id, details) VALUES (?, ?, ?, ?)',
      [req.session.user.id, 'notes_updated', req.params.id, 'Admin notes updated']
    );
    req.flash('success', 'Notes saved.');
  } catch (err) {
    req.flash('error', 'Failed to save notes.');
  }
  res.redirect(`/admin/volunteers/${req.params.id}`);
});

// POST /admin/volunteers/:id/hours
router.post('/volunteers/:id/hours', isAdmin, async (req, res) => {
  const { hours } = req.body;
  try {
    await db.execute('UPDATE volunteers SET hours_logged = hours_logged + ? WHERE id = ?', [hours, req.params.id]);
    req.flash('success', `${hours} hours added.`);
  } catch (err) {
    req.flash('error', 'Failed to log hours.');
  }
  res.redirect(`/admin/volunteers/${req.params.id}`);
});

// GET /admin/export (CSV)
router.get('/export', isAdmin, async (req, res) => {
  const { status } = req.query;
  let query = `SELECT u.name, u.email, v.phone, v.age, v.skills, v.availability, v.status, v.hours_logged, v.created_at
               FROM volunteers v JOIN users u ON v.user_id = u.id`;
  const params = [];
  if (status) {
    query += ' WHERE v.status = ?';
    params.push(status);
  }
  query += ' ORDER BY v.created_at DESC';

  const [rows] = await db.execute(query, params);
  const data = rows.map(r => ({
    Name: r.name,
    Email: r.email,
    Phone: r.phone,
    Age: r.age,
    Skills: r.skills,
    Availability: r.availability,
    Status: r.status,
    'Hours Logged': r.hours_logged,
    'Registered At': new Date(r.created_at).toLocaleDateString()
  }));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="volunteers-${Date.now()}.csv"`);

  stringify(data, { header: true }, (err, output) => {
    if (err) return res.status(500).send('Export failed');
    res.send(output);
  });
});

// GET /admin/events
router.get('/events', isAdmin, async (req, res) => {
  const [events] = await db.execute(
    `SELECT e.*, u.name as creator, 
     (SELECT COUNT(*) FROM event_volunteers ev WHERE ev.event_id = e.id) as joined_count
     FROM events e LEFT JOIN users u ON e.created_by = u.id
     ORDER BY e.event_date DESC`
  );
  res.render('admin/events', {
    title: 'Events – VolunteerHub',
    user: req.session.user,
    events,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// POST /admin/events
router.post('/events', isAdmin, async (req, res) => {
  const { title, description, event_date, location, required_skills, max_volunteers } = req.body;
  try {
    await db.execute(
      'INSERT INTO events (title, description, event_date, location, required_skills, max_volunteers, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, event_date, location, required_skills, max_volunteers, req.session.user.id]
    );
    req.flash('success', 'Event created!');
  } catch (err) {
    req.flash('error', 'Failed to create event.');
  }
  res.redirect('/admin/events');
});

// DELETE /admin/events/:id
router.post('/events/:id/delete', isAdmin, async (req, res) => {
  await db.execute('DELETE FROM events WHERE id = ?', [req.params.id]);
  req.flash('success', 'Event deleted.');
  res.redirect('/admin/events');
});

module.exports = router;