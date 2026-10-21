const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    content: { type: String, required: true, maxlength: 20000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
const express = require('express');
const Blog = require('../models/Blog');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const shape = (b) => ({
  id: b._id,
  title: b.title,
  content: b.content,
  author: b.author && b.author.name ? { id: b.author._id, name: b.author.name } : null,
  authorId: b.author && b.author._id ? b.author._id : b.author,
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});

function validate(body) {
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  if (!title || !content) return { error: 'Title and content are required' };
  if (title.length > 150) return { error: 'Title must be 150 characters or fewer' };
  return { title, content };
}

// All blogs (public)
router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter = q
      ? { $or: [{ title: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }] }
      : {};
    const blogs = await Blog.find(filter).sort({ createdAt: -1 }).limit(100).populate('author', 'name');
    res.json({ blogs: blogs.map(shape) });
  } catch (err) {
    next(err);
  }
});

// Only the logged-in user's blogs (dashboard)
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const blogs = await Blog.find({ author: req.user._id }).sort({ createdAt: -1 }).populate('author', 'name');
    res.json({ blogs: blogs.map(shape) });
  } catch (err) {
    next(err);
  }
});

// Single blog (public)
router.get('/:id', async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name');
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json({ blog: shape(blog) });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const v = validate(req.body || {});
    if (v.error) return res.status(400).json({ error: v.error });
    const blog = await Blog.create({ title: v.title, content: v.content, author: req.user._id });
    await blog.populate('author', 'name');
    res.status(201).json({ blog: shape(blog) });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    if (String(blog.author) !== String(req.user._id)) return res.status(403).json({ error: 'You can only edit your own blogs' });
    const v = validate(req.body || {});
    if (v.error) return res.status(400).json({ error: v.error });
    blog.title = v.title;
    blog.content = v.content;
    await blog.save();
    await blog.populate('author', 'name');
    res.json({ blog: shape(blog) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    if (String(blog.author) !== String(req.user._id)) return res.status(403).json({ error: 'You can only delete your own blogs' });
    await blog.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
