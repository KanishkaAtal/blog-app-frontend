/* Sesoma– frontend blog app (HTML/CSS/JS, data kept in localStorage) */
const $ = (s) => document.querySelector(s);
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const getUsers = () => read("users", []);
const getPosts = () => read("posts", []);
const getSession = () => read("session", null);

/* ---------- Seed sample posts on first visit ---------- */
if (!localStorage.getItem("posts")) {
  write("posts", [
    { id: 1, title: "Why I started learning web development", category: "Tech", author: "Sesoma Team", authorEmail: "", content: "Every website you use is built from three things: HTML for structure, CSS for style and JavaScript for behaviour. Start small, build often, and share what you learn.", date: new Date().toISOString() },
    { id: 2, title: "Five habits of consistent coders", category: "Lifestyle", author: "Sesoma Team", authorEmail: "", content: "Code a little every day, read other people's code, write notes, ask questions early and ship small projects instead of waiting for perfect ones.", date: new Date().toISOString() },
  ]);
}

/* ---------- Header & footer ---------- */
function renderLayout() {
  const user = getSession();
  const links = user
    ? `<a href="index.html">Home</a><a href="dashboard.html">Dashboard</a><a href="create-blog.html">Create Blog</a><a href="#" id="logout" class="btn ghost">Log out</a>`
    : `<a href="index.html">Home</a><a href="login.html">Login</a><a href="register.html" class="btn">Register</a>`;
  $("#site-header").innerHTML = `<a href="index.html" class="logo">Sesoma</a><nav aria-label="Main">${links}</nav>`;
  $("#site-footer").innerHTML = `&copy; ${new Date().getFullYear()} Sesoma. Built as a frontend internship project.`;
  const out = $("#logout");
  if (out) out.addEventListener("click", (e) => { e.preventDefault(); localStorage.removeItem("session"); location.href = "index.html"; });
}

const requireLogin = () => { if (!getSession()) { location.href = "login.html"; return false; } return true; };
function showMsg(el, text, type) { el.textContent = text; el.className = "msg " + type; }

/* ---------- Page: Home ---------- */
function initHome() {
  const posts = getPosts().slice().reverse();
  $("#post-list").innerHTML = posts.map((p) => `
    <article class="card">
      <span class="tag">${esc(p.category)}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.content.slice(0, 120))}${p.content.length > 120 ? "…" : ""}</p>
      <span class="meta">By ${esc(p.author)} on ${fmtDate(p.date)}</span>
    </article>`).join("");
  if (getSession()) $("#hero-cta").innerHTML = `<a class="btn" href="create-blog.html">Write a post</a>`;
}

/* ---------- Page: Register ---------- */
function initRegister() {
  $("#register-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#name").value.trim();
    const email = $("#email").value.trim().toLowerCase();
    const password = $("#password").value;
    const confirm = $("#confirm").value;
    const msg = $("#msg");

    if (name.length < 2) return showMsg(msg, "Enter your full name.", "error");
    if (!/^\S+@\S+\.\S+$/.test(email)) return showMsg(msg, "Enter a valid email address.", "error");
    if (password.length < 6) return showMsg(msg, "Password must be at least 6 characters.", "error");
    if (password !== confirm) return showMsg(msg, "Passwords do not match.", "error");

    const users = getUsers();
    if (users.some((u) => u.email === email)) return showMsg(msg, "This email is already registered. Log in instead.", "error");

    users.push({ name, email, password });
    write("users", users);
    showMsg(msg, "Account created. Redirecting to login…", "ok");
    setTimeout(() => (location.href = "login.html"), 1000);
  });
}

/* ---------- Page: Login ---------- */
function initLogin() {
  $("#login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#email").value.trim().toLowerCase();
    const password = $("#password").value;
    const user = getUsers().find((u) => u.email === email && u.password === password);
    if (!user) return showMsg($("#msg"), "Email or password is incorrect.", "error");
    write("session", { name: user.name, email: user.email });
    location.href = "dashboard.html";
  });
}

/* ---------- Page: Dashboard ---------- */
function initDashboard() {
  if (!requireLogin()) return;
  const user = getSession();
  $("#welcome").textContent = `Welcome, ${user.name}`;

  function draw() {
    const mine = getPosts().filter((p) => p.authorEmail === user.email).reverse();
    $("#stat-posts").textContent = mine.length;
    $("#my-posts").innerHTML = mine.length
      ? mine.map((p) => `
        <article class="card">
          <span class="tag">${esc(p.category)}</span>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.content.slice(0, 100))}${p.content.length > 100 ? "…" : ""}</p>
          <span class="meta">${fmtDate(p.date)}</span>
          <div class="actions">
            <a class="btn ghost" href="create-blog.html?edit=${p.id}">Edit</a>
            <button class="btn danger" data-del="${p.id}">Delete</button>
          </div>
        </article>`).join("")
      : `<div class="empty">You have no posts yet. <a href="create-blog.html">Write your first post</a>.</div>`;
  }

  $("#my-posts").addEventListener("click", (e) => {
    const id = e.target.dataset.del;
    if (id && confirm("Delete this post?")) {
      write("posts", getPosts().filter((p) => String(p.id) !== id));
      draw();
    }
  });
  draw();
}

/* ---------- Page: Create / Edit Blog ---------- */
function initCreate() {
  if (!requireLogin()) return;
  const user = getSession();
  const editId = new URLSearchParams(location.search).get("edit");
  const posts = getPosts();
  const existing = editId ? posts.find((p) => String(p.id) === editId && p.authorEmail === user.email) : null;

  if (existing) {
    $("#page-title").textContent = "Edit your post";
    $("#title").value = existing.title;
    $("#category").value = existing.category;
    $("#content").value = existing.content;
    $("#save-btn").textContent = "Save changes";
  }

  $("#blog-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("#title").value.trim();
    const category = $("#category").value;
    const content = $("#content").value.trim();
    if (title.length < 3) return showMsg($("#msg"), "Title must be at least 3 characters.", "error");
    if (content.length < 20) return showMsg($("#msg"), "Write at least 20 characters of content.", "error");

    if (existing) {
      Object.assign(existing, { title, category, content });
    } else {
      posts.push({ id: Date.now(), title, category, content, author: user.name, authorEmail: user.email, date: new Date().toISOString() });
    }
    write("posts", posts);
    showMsg($("#msg"), existing ? "Changes saved." : "Post published.", "ok");
    setTimeout(() => (location.href = "dashboard.html"), 800);
  });
}

/* ---------- Router ---------- */
renderLayout();
const page = document.body.dataset.page;
({ home: initHome, register: initRegister, login: initLogin, dashboard: initDashboard, create: initCreate })[page]?.();
