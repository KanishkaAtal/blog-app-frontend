const mongoose = require("mongoose");

const CATEGORIES = ["General", "Tech", "DSA", "Career", "Lifestyle"];

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    author: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, enum: CATEGORIES, default: "General" },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

blogSchema.index({ title: "text", content: "text" });

module.exports = mongoose.model("Blog", blogSchema);
module.exports.CATEGORIES = CATEGORIES;
const express = require("express");
const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const { CATEGORIES } = require("../models/Blog");

const router = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// READ (all) with optional search + category filter
router.get("/", async (req, res) => {
  try {
    const { q = "", category = "" } = req.query;
    const filter = {};
    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ title: rx }, { content: rx }, { author: rx }];
    }
    if (CATEGORIES.includes(category)) filter.category = category;

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    res.render("index", { blogs, q, category, CATEGORIES });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// CREATE (form)
router.get("/new", (req, res) => {
  res.render("form", { blog: {}, CATEGORIES, action: "/blogs", method: "POST", heading: "New Blog", error: null });
});

// CREATE (submit)
router.post("/", async (req, res) => {
  const { title, author, category, content } = req.body;
  try {
    const blog = await Blog.create({ title, author, category, content });
    res.redirect(`/blogs/${blog._id}`);
  } catch (err) {
    res.status(400).render("form", {
      blog: req.body, CATEGORIES, action: "/blogs", method: "POST", heading: "New Blog", error: err.message,
    });
  }
});

// Guard against invalid ids
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(404).render("error", { message: "Blog not found" });
  next();
});

// READ (single)
router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).render("error", { message: "Blog not found" });
  res.render("show", { blog });
});

// UPDATE (form)
router.get("/:id/edit", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).render("error", { message: "Blog not found" });
  res.render("form", {
    blog, CATEGORIES, action: `/blogs/${blog._id}?_method=PUT`, method: "POST", heading: "Edit Blog", error: null,
  });
});

// UPDATE (submit)
router.put("/:id", async (req, res) => {
  const { title, author, category, content } = req.body;
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, author, category, content },
      { new: true, runValidators: true }
    );
    if (!blog) return res.status(404).render("error", { message: "Blog not found" });
    res.redirect(`/blogs/${blog._id}`);
  } catch (err) {
    res.status(400).render("form", {
      blog: { ...req.body, _id: req.params.id }, CATEGORIES,
      action: `/blogs/${req.params.id}?_method=PUT`, method: "POST", heading: "Edit Blog", error: err.message,
    });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.redirect("/blogs");
});

module.exports = router;
