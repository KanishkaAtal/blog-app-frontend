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