require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db/connection');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'volunteerhub-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Flash messages
app.use(flash());

// Global locals for EJS
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/volunteer', require('./routes/volunteers'));
app.use('/admin', require('./routes/admin'));

// Home Route (Landing Page)
app.get('/', (req, res) => {
  res.render('landing', { 
    title: 'VolunteerHub – Make a Difference Today',
    user: req.session.user || null
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found – VolunteerHub' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Server Error – VolunteerHub' });
});

// Auto-create admin on startup
async function ensureAdmin() {
  try {
    const [rows] = await db.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!rows.length) {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
      await db.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
        ['Super Admin', process.env.ADMIN_EMAIL || 'admin@volunteer.com', hashed]
      );
      console.log('✅ Default admin created: admin@volunteer.com / Admin@123');
    }
  } catch (err) {
    console.error('Admin setup error:', err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 VolunteerHub running at http://localhost:${PORT}`);
  await ensureAdmin();
});