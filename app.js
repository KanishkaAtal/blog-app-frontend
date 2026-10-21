(function () {
  const app = document.getElementById('app');
  const navLinks = document.getElementById('navLinks');
  let user = null;

  document.getElementById('yr').textContent = new Date().getFullYear();
  document.getElementById('menuBtn').addEventListener('click', () => navLinks.classList.toggle('open'));

  // ---------- helpers ----------
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  const excerpt = (t, n = 160) => (t.length > n ? t.slice(0, n).trim() + '…' : t);

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  async function api(url, method = 'GET', body) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* ignore */ }
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  const go = (path) => { location.hash = path; };
  const showError = (form, msg) => {
    let box = form.querySelector('.error');
    if (!box) { box = document.createElement('div'); box.className = 'error'; form.appendChild(box); }
    box.textContent = msg;
  };

  // ---------- nav ----------
  function renderNav() {
    const h = location.hash || '#/';
    const a = (href, text) => `<a href="${href}" class="${h === href ? 'active' : ''}">${text}</a>`;
    navLinks.innerHTML = user
      ? a('#/', 'Home') + a('#/dashboard', 'Dashboard') + a('#/new', 'Write') + a('#/profile', 'Profile') +
        `<button class="link" id="logoutBtn">Logout</button>`
      : a('#/', 'Home') + a('#/login', 'Login') + `<a href="#/register" class="btn small">Sign up</a>`;
    navLinks.classList.remove('open');
    const lb = document.getElementById('logoutBtn');
    if (lb) lb.onclick = async () => {
      await api('/api/auth/logout', 'POST');
      user = null;
      toast('Logged out');
      go('#/');
      route();
    };
  }

  // ---------- views ----------
  function postCard(b, withActions) {
    return `
      <article class="post-card">
        <h3><a href="#/blog/${b.id}">${esc(b.title)}</a></h3>
        <div class="meta">${b.author ? 'by ' + esc(b.author.name) + ' · ' : ''}${fmtDate(b.createdAt)}</div>
        <p class="excerpt">${esc(excerpt(b.content))}</p>
        ${withActions ? `<div class="card-actions">
          <a class="btn ghost small" href="#/edit/${b.id}">Edit</a>
          <button class="btn danger small" data-del="${b.id}">Delete</button></div>` : ''}
      </article>`;
  }

  async function viewHome() {
    app.innerHTML = `
      <section class="hero">
        <h1>Stories worth sharing.</h1>
        <p>Read what the community is writing, or start your own blog in a minute.</p>
        ${user ? '<a class="btn" href="#/new">Write a post</a>' : '<a class="btn" href="#/register">Get started</a>'}
      </section>
      <div class="toolbar"><input id="search" type="search" placeholder="Search blogs by title…"></div>
      <div id="list" class="loading">Loading blogs…</div>`;
    const list = document.getElementById('list');
    async function load(q = '') {
      try {
        const { blogs } = await api('/api/blogs' + (q ? '?q=' + encodeURIComponent(q) : ''));
        list.className = blogs.length ? 'grid' : '';
        list.innerHTML = blogs.length ? blogs.map((b) => postCard(b)).join('') : '<div class="empty">No blogs found yet.</div>';
      } catch (e) { list.className = ''; list.innerHTML = `<div class="error">${esc(e.message)}</div>`; }
    }
    load();
    let timer;
    document.getElementById('search').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => load(e.target.value.trim()), 300);
    });
  }

  async function viewBlog(id) {
    app.innerHTML = '<div class="loading">Loading…</div>';
    try {
      const { blog } = await api('/api/blogs/' + id);
      const mine = user && String(blog.authorId) === String(user.id);
      document.title = blog.title + ' – Inkwell';
      app.innerHTML = `
        <article class="article">
          <a href="#/">← All blogs</a>
          <h1>${esc(blog.title)}</h1>
          <div class="meta">by ${esc(blog.author ? blog.author.name : 'Unknown')} · ${fmtDate(blog.createdAt)}${blog.updatedAt !== blog.createdAt ? ' · edited' : ''}</div>
          <div class="body">${esc(blog.content)}</div>
          ${mine ? `<div class="card-actions" style="margin-top:24px">
            <a class="btn ghost small" href="#/edit/${blog.id}">Edit</a>
            <button class="btn danger small" data-del="${blog.id}" data-redirect="1">Delete</button></div>` : ''}
        </article>`;
    } catch (e) {
      app.innerHTML = `<div class="empty">${esc(e.message)}<br><a href="#/">Back to home</a></div>`;
    }
  }

  function authForm(mode) {
    const reg = mode === 'register';
    app.innerHTML = `
      <form class="card-form" id="authForm" novalidate>
        <h2>${reg ? 'Create your account' : 'Welcome back'}</h2>
        ${reg ? '<label for="name">Name</label><input id="name" autocomplete="name" required>' : ''}
        <label for="email">Email</label><input id="email" type="email" autocomplete="email" required>
        <label for="password">Password</label><input id="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" minlength="6" required>
        <div style="margin-top:20px"><button class="btn" style="width:100%">${reg ? 'Sign up' : 'Log in'}</button></div>
        <div class="form-foot">${reg ? 'Already have an account? <a href="#/login">Log in</a>' : 'New here? <a href="#/register">Create an account</a>'}</div>
      </form>`;
    const form = document.getElementById('authForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        const payload = { email: form.email.value, password: form.password.value };
        if (reg) payload.name = form.name.value;
        const data = await api('/api/auth/' + mode, 'POST', payload);
        user = data.user;
        toast(reg ? 'Account created!' : 'Logged in');
        go('#/dashboard');
      } catch (err) { showError(form, err.message); }
      btn.disabled = false;
    });
  }

  async function viewDashboard() {
    app.innerHTML = '<div class="loading">Loading your blogs…</div>';
    try {
      const { blogs } = await api('/api/blogs/mine');
      app.innerHTML = `
        <div class="page-head">
          <div><h2>Your dashboard</h2><div class="stats">Hi ${esc(user.name)} · ${blogs.length} ${blogs.length === 1 ? 'post' : 'posts'}</div></div>
          <a class="btn" href="#/new">+ New post</a>
        </div>
        ${blogs.length ? `<div class="grid">${blogs.map((b) => postCard(b, true)).join('')}</div>`
          : '<div class="empty">You haven\'t written anything yet.<br><br><a class="btn" href="#/new">Write your first post</a></div>'}`;
    } catch (e) { app.innerHTML = `<div class="error">${esc(e.message)}</div>`; }
  }

  async function viewEditor(id) {
    let blog = { title: '', content: '' };
    if (id) {
      try { blog = (await api('/api/blogs/' + id)).blog; }
      catch (e) { app.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
      if (String(blog.authorId) !== String(user.id)) { toast('You can only edit your own blogs'); return go('#/dashboard'); }
    }
    app.innerHTML = `
      <form class="card-form wide" id="blogForm">
        <h2>${id ? 'Edit post' : 'New post'}</h2>
        <label for="title">Title</label><input id="title" maxlength="150" required value="${esc(blog.title)}">
        <label for="content">Content</label><textarea id="content" required>${esc(blog.content)}</textarea>
        <div style="margin-top:20px;display:flex;gap:10px">
          <button class="btn">${id ? 'Save changes' : 'Publish'}</button>
          <a class="btn ghost" href="#/dashboard">Cancel</a>
        </div>
      </form>`;
    const form = document.getElementById('blogForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        const payload = { title: form.title.value, content: form.content.value };
        const data = id ? await api('/api/blogs/' + id, 'PUT', payload) : await api('/api/blogs', 'POST', payload);
        toast(id ? 'Post updated' : 'Post published');
        go('#/blog/' + data.blog.id);
      } catch (err) { showError(form, err.message); }
      btn.disabled = false;
    });
  }

  function viewProfile() {
    app.innerHTML = `
      <form class="card-form" id="profileForm">
        <h2>Your profile</h2>
        <label for="name">Name</label><input id="name" required value="${esc(user.name)}">
        <label for="email">Email</label><input id="email" disabled value="${esc(user.email)}">
        <label for="bio">Bio</label><textarea id="bio" maxlength="300" style="min-height:90px">${esc(user.bio)}</textarea>
        <div style="margin-top:20px"><button class="btn">Save profile</button></div>
      </form>`;
    const form = document.getElementById('profileForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await api('/api/auth/me', 'PUT', { name: form.name.value, bio: form.bio.value });
        user = data.user;
        toast('Profile saved');
        renderNav();
      } catch (err) { showError(form, err.message); }
    });
  }

  // ---------- router ----------
  const protectedRoutes = ['dashboard', 'new', 'edit', 'profile'];

  async function route() {
    document.title = 'Inkwell – Full Stack Blog';
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/');
    const page = parts[0] || 'home';

    if (protectedRoutes.includes(page) && !user) { toast('Please log in first'); return go('#/login'); }
    if ((page === 'login' || page === 'register') && user) return go('#/dashboard');

    renderNav();
    window.scrollTo(0, 0);
    switch (page) {
      case 'home': return viewHome();
      case 'blog': return viewBlog(parts[1]);
      case 'login': return authForm('login');
      case 'register': return authForm('register');
      case 'dashboard': return viewDashboard();
      case 'new': return viewEditor();
      case 'edit': return viewEditor(parts[1]);
      case 'profile': return viewProfile();
      default: app.innerHTML = '<div class="empty">Page not found.<br><a href="#/">Go home</a></div>';
    }
  }

  // delete handler (event delegation)
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-del]');
    if (!btn) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api('/api/blogs/' + btn.dataset.del, 'DELETE');
      toast('Post deleted');
      if (btn.dataset.redirect) go('#/dashboard'); else route();
    } catch (err) { toast(err.message); }
  });

  window.addEventListener('hashchange', route);

  (async function init() {
    try { user = (await api('/api/auth/me')).user; } catch (e) { user = null; }
    route();
  })();
})();
