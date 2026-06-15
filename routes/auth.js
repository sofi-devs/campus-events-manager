const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

const router = express.Router();
/* ----------  Register ---------- */
function redirectIfLoggedIn(req, res, next) {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
}

router.get('/register', redirectIfLoggedIn, (req, res) => {
  res.render('auth/register', { title: 'Register', formData: {}, errors: [] });
});

router.post('/register', async (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  const errors = [];

 if (!name  !email  !password || !confirmPassword) {
    {
    errors.push('All fields are required.');
  }

  if (password && password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  if (errors.length) {
    return res
      .status(400)
      .render('auth/register', {
        title: 'Register',
        formData: { name, email },
        errors
      });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length) {
      return res.status(400).render('auth/register', {
        title: 'Register',
        formData: { name, email },
        errors: ['That email is already registered.'],
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role`,
      [name, email, hash]
    );

    req.session.user = result.rows[0];

    req.session.flash = {
      type: 'success',
      message: `Welcome, ${result.rows[0].name}!`,
    };

    res.redirect('/');
  } catch (err) {
    next(err);
  }
});


/* ----------  Login ---------- */
router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('auth/login', { title: 'Login', formData: {}, errors: [] });
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

   if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        formData: { email },
        errors: ['Invalid email or password.'],
      });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    req.session.flash = { type: 'success', message: 'Logged in successfully.' };
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

/* ----------  Logout ---------- */
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
