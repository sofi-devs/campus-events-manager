require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');

const app = express();

/* ----------  View engine + layouts (EJS research component) ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout'); // every view is wrapped in views/layout.ejs

/* ----------  Built-in & third-party middleware ---------- */
app.use(express.urlencoded({ extended: true })); // parse HTML form bodies
app.use(express.static(path.join(__dirname, 'public'))); // serve /public
app.use(methodOverride('_method')); // allow PUT/DELETE from <form> via ?_method=

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
  })
);

/* ----------  Custom middleware: simple request logger ---------- */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method}  ${req.originalUrl}`);
  next();
});

/* ----------  Custom middleware: expose user + flash to every view ---------- */
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash; // flash messages are shown once then cleared
  next();
});

/* ----------  Routes ---------- */
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/events', eventRoutes);

/* ----------  404 handler ---------- */
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found',
    message: 'The page you are looking for does not exist.',
  });
});

/* ----------  Error handler ---------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again.',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎓 Campus Events running at http://localhost:${PORT}\n`);
});
