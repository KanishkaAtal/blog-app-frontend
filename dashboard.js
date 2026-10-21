const express = require('express');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Every route in this file is private
router.use(requireAuth);

// Dashboard: only the logged-in user's blogs
router.get('/', async (req, res) => {
  const blogs = await Blog.find({ author: req.user._id }).sort({ createdAt: -1 });
  res.render('dashboard', { blogs });
});

// Profile
router.get('/profile', async (req, res) => {
  const blogCount = await Blog.countDocuments({ author: req.user._id });
  res.render('profile', { blogCount });
});

// Create
router.get('/blogs/new', (req, res) => {
  res.render('blog-form', { blog: {}, action: '/dashboard/blogs', heading: 'New blog', error: null });
});

router.post('/blogs', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).render('blog-form', {
      blog: { title, content },
      action: '/dashboard/blogs',
      heading: 'New blog',
      error: 'Title and content are required.',
    });
  }
  const blog = await Blog.create({ title, content, author: req.user._id });
  res.redirect(`/blogs/${blog._id}`);
});

// Load a blog only if it belongs to the logged-in user
async function findOwnBlog(req) {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  return Blog.findOne({ _id: req.params.id, author: req.user._id });
}

// Edit
router.get('/blogs/:id/edit', async (req, res) => {
  const blog = await findOwnBlog(req);
  if (!blog) return res.status(404).render('404');
  res.render('blog-form', { blog, action: `/dashboard/blogs/${blog._id}`, heading: 'Edit blog', error: null });
});

router.post('/blogs/:id', async (req, res) => {
  const blog = await findOwnBlog(req);
  if (!blog) return res.status(404).render('404');
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).render('blog-form', {
      blog: { _id: blog._id, title, content },
      action: `/dashboard/blogs/${blog._id}`,
      heading: 'Edit blog',
      error: 'Title and content are required.',
    });
  }
  blog.title = title;
  blog.content = content;
  await blog.save();
  res.redirect(`/blogs/${blog._id}`);
});

// Delete
router.post('/blogs/:id/delete', async (req, res) => {
  const blog = await findOwnBlog(req);
  if (!blog) return res.status(404).render('404');
  await blog.deleteOne();
  res.redirect('/dashboard');
});

module.exports = router;
