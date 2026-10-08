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