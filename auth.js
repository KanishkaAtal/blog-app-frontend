const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { title: 'Register', error: null, values: {} });
});

router.post('/register', async (req, res, next) => {
  const { username = '', email = '', password = '' } = req.body;
  const values = { username, email };
  try {
    if (password.length < 6) {
      return res.status(400).render('register', { title: 'Register', error: 'Password must be at least 6 characters.', values });
    }
    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (exists) {
      return res.status(400).render('register', { title: 'Register', error: 'Username or email already in use.', values });
    }
    const user = await User.create({ username, email, password });
    req.session.user = { id: user._id.toString(), username: user.username };
    req.session.flash = 'Welcome, ' + user.username + '! Your account has been created.';
    res.redirect('/');
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map((e) => e.message).join(' ');
      return res.status(400).render('register', { title: 'Register', error: msg, values });
    }
    next(err);
  }
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: null });
});

router.post('/login', async (req, res, next) => {
  const { email = '', password = '' } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).render('login', { title: 'Login', error: 'Invalid email or password.' });
    }
    req.session.user = { id: user._id.toString(), username: user.username };
    req.session.flash = 'Logged in successfully.';
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
