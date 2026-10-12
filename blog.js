const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
const express = require('express');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.flash = 'Please log in first.';
    return res.redirect('/login');
  }
  next();
}

router.get('/new', requireLogin, (req, res) => {
  res.render('new-blog', { title: 'New post', error: null, values: {} });
});

router.post('/', requireLogin, async (req, res, next) => {
  const { title = '', content = '' } = req.body;
  try {
    if (!title.trim() || !content.trim()) {
      return res.status(400).render('new-blog', { title: 'New post', error: 'Title and content are required.', values: { title, content } });
    }
    const blog = await Blog.create({ title, content, author: req.session.user.id });
    res.redirect('/blogs/' + blog._id);
  } catch (err) {
    next(err);
  }
});

// Individual blog details page
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).render('error', { title: 'Not found', message: 'Blog post not found.' });
    }
    const blog = await Blog.findById(req.params.id).populate('author', 'username').lean();
    if (!blog) {
      return res.status(404).render('error', { title: 'Not found', message: 'Blog post not found.' });
    }
    const isOwner = !!req.session.user && blog.author && blog.author._id.toString() === req.session.user.id;
    res.render('blog', { title: blog.title, blog, isOwner });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', requireLogin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/');
    // Only the author can delete their own post
    await Blog.deleteOne({ _id: req.params.id, author: req.session.user.id });
    req.session.flash = 'Post deleted.';
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
