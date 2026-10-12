const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const SECRET = "change_this_secret_later"; // move to .env in Module 3

app.use(cors());           // lets your frontend call this server
app.use(express.json());   // lets server read JSON from requests

// Temporary storage (Module 3 replaces this with MongoDB)
const users = [];
const blogs = [];

// Middleware: checks the token on protected routes
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Please login first" });
  }
}

// 1. User Registration
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });
  if (users.find((u) => u.email === email))
    return res.status(409).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  users.push({ id: users.length + 1, name, email, password: hashed });
  res.status(201).json({ message: "Registered successfully" });
});

// 2. User Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Invalid email or password" });

  const token = jwt.sign({ id: user.id, name: user.name }, SECRET, {
    expiresIn: "1d",
  });
  res.json({ message: "Login successful", token, name: user.name });
});

// 3. Create Blog (login required)
app.post("/api/blogs", auth, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content)
    return res.status(400).json({ message: "Title and content required" });

  const blog = {
    id: blogs.length + 1,
    title,
    content,
    author: req.user.name,
    createdAt: new Date(),
  };
  blogs.push(blog);
  res.status(201).json(blog);
});

// Extra: list all blogs (for your Dashboard page)
app.get("/api/blogs", (req, res) => res.json(blogs));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');
const Blog = require('./models/Blog');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!MONGODB_URI || !SESSION_SECRET) {
  console.error('Missing MONGODB_URI or SESSION_SECRET. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGODB_URI }),
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 },
  })
);

// Make the logged-in user and flash message available to every view
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.get('/', async (req, res, next) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }).populate('author', 'username').lean();
    res.render('index', { blogs });
  } catch (err) {
    next(err);
  }
});

app.use('/', authRoutes);
app.use('/blogs', blogRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: 'Page not found', message: 'That page does not exist.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Something went wrong', message: 'Please try again later.' });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
