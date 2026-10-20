const express = require('express');
const User = require('../models/User');
const { signToken, setAuthCookie, clearAuthCookie, guestOnly, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/register', guestOnly, (req, res) => {
  res.render('register', { error: null, form: {} });
});

router.post('/register', guestOnly, async (req, res) => {
  const { name, email, password } = req.body;
  const form = { name, email };
  try {
    if (!name || !email || !password) {
      return res.status(400).render('register', { error: 'All fields are required.', form });
    }
    if (password.length < 6) {
      return res.status(400).render('register', { error: 'Password must be at least 6 characters.', form });
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).render('register', { error: 'An account with this email already exists.', form });
    }
    const user = await User.create({ name, email, password });
    setAuthCookie(res, signToken(user._id));
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).render('register', { error: 'Something went wrong. Please try again.', form });
  }
});

router.get('/login', guestOnly, (req, res) => {
  res.render('login', { error: null, form: {} });
});

router.post('/login', guestOnly, async (req, res) => {
  const { email, password } = req.body;
  const form = { email };
  try {
    const user = email && (await User.findOne({ email: email.toLowerCase().trim() }));
    // Same message for unknown email and wrong password (avoids leaking which accounts exist)
    if (!user || !password || !(await user.comparePassword(password))) {
      return res.status(401).render('login', { error: 'Invalid email or password.', form });
    }
    setAuthCookie(res, signToken(user._id));
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).render('login', { error: 'Something went wrong. Please try again.', form });
  }
});

// Logout is a POST so other sites can't log users out via a plain link or image
router.post('/logout', requireAuth, (req, res) => {
  clearAuthCookie(res);
  res.redirect('/');
});

module.exports = router;
