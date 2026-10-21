const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = 'token';

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // not readable from browser JS
    sameSite: 'lax', // blocks cross-site POSTs (CSRF protection)
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

// Runs on every request: exposes the logged-in user (or null) to views as `currentUser`
async function attachUser(req, res, next) {
  req.user = null;
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(id).select('-password');
    } catch (err) {
      clearAuthCookie(res); // invalid or expired token
    }
  }
  res.locals.currentUser = req.user;
  next();
}

// Guards private routes: redirect to login when not authenticated
function requireAuth(req, res, next) {
  if (!req.user) return res.redirect('/login');
  next();
}

// Keeps logged-in users away from login/register pages
function guestOnly(req, res, next) {
  if (req.user) return res.redirect('/dashboard');
  next();
}

module.exports = { signToken, setAuthCookie, clearAuthCookie, attachUser, requireAuth, guestOnly };
