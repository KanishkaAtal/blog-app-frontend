# Sesoma – Full Stack Blog Application

A full stack blog platform where users can sign up, log in, and write, edit and manage their own blog posts. Built as the final project of my Full Stack Web Development course.

**Live Demo:** YOUR_LIVE_LINK

## Features

- Signup and login with JWT authentication (httpOnly cookie, bcrypt-hashed passwords)
- Create, read, update and delete blog posts
- Home page listing all blogs with search, and a page for each individual blog
- Protected dashboard showing only the logged-in user's blogs
- Profile page (edit name and bio) and logout
- Owner-only edit/delete enforced on the server
- Responsive layout for mobile, tablet and desktop

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript (single-page app with hash routing)
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas with Mongoose
- **Auth:** JSON Web Tokens, bcryptjs, cookie-parser
- **Deployment:** Render

## Screenshots

Add screenshots to a `screenshots/` folder and link them here.

![Home](screenshots/home.png)
![Dashboard](screenshots/dashboard.png)

## Getting Started

### Prerequisites

- Node.js 18+
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_string
PORT=5000
```

### Run Locally

```bash
npm run dev
```

Open http://localhost:5000.

## Project Structure

```
├── server.js          # Express app entry point
├── models/            # Mongoose schemas (User, Blog)
├── routes/            # auth and blogs API routes
├── middleware/        # JWT auth middleware
├── public/            # Frontend (HTML, CSS, JS)
├── render.yaml        # Render deployment config
└── .env.example
```

## API Endpoints

| Method | Endpoint           | Description                     | Auth |
|--------|--------------------|---------------------------------|------|
| POST   | /api/auth/register | Create a new account            | No   |
| POST   | /api/auth/login    | Log in                          | No   |
| POST   | /api/auth/logout   | Log out                         | No   |
| GET    | /api/auth/me       | Get the current user            | Yes  |
| PUT    | /api/auth/me       | Update name and bio             | Yes  |
| GET    | /api/blogs         | Get all blogs (supports `?q=`)  | No   |
| GET    | /api/blogs/mine    | Get the logged-in user's blogs  | Yes  |
| GET    | /api/blogs/:id     | Get a single blog               | No   |
| POST   | /api/blogs         | Create a blog                   | Yes  |
| PUT    | /api/blogs/:id     | Update your blog                | Yes  |
| DELETE | /api/blogs/:id     | Delete your blog                | Yes  |

## Deployment (Render)

1. Push this project to GitHub.
2. On Render, create a **Web Service** from the repo (Build: `npm install`, Start: `npm start`).
3. Add environment variables `MONGODB_URI`, `JWT_SECRET` and `NODE_ENV=production`.
4. In MongoDB Atlas, allow network access from anywhere (`0.0.0.0/0`).

## Author

**Kanishka Atal**
3rd Year B.Tech CSE, Government Engineering College Bikaner
[LinkedIn](YOUR_LINKEDIN_PROFILE) | [GitHub](https://github.com/YOUR_USERNAME)
