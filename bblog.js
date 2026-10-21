const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
const express = require('express');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');

const router = express.Router();

// Public: all blogs
router.get('/', async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 }).populate('author', 'name');
  res.render('index', { blogs });
});

// Public: single blog page
router.get('/blogs/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).render('404');
  const blog = await Blog.findById(req.params.id).populate('author', 'name');
  if (!blog) return res.status(404).render('404');
  const isOwner = !!req.user && !!blog.author && blog.author._id.equals(req.user._id);
  res.render('blog', { blog, isOwner });
});

module.exports = router;
