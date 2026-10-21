# Sesoma – Responsive Blog Application (Frontend)

A responsive blog interface built with HTML, CSS and JavaScript as part of the
Full Stack Web Development internship (Module 1: Frontend Development).

## Pages
- `index.html` – Home (latest posts)
- `register.html` – Create an account
- `login.html` – Log in
- `dashboard.html` – Your posts (edit / delete)
- `create.html` – Write or edit a post

## Features
- Responsive layout (mobile, tablet, desktop)
- Form validation with clear error messages
- Login session and protected pages
- Create, edit and delete posts
- Data stored in the browser with localStorage (backend comes in Module 2)

## Run locally
Open `index.html` in your browser. No installation needed.
# DevBlog — Database Integration (Module 3)

A full-stack blog application connected to **MongoDB**. Users can register and log in, publish blog posts, see every post on the home page, and open a dedicated page for each post.

## Features

- **MongoDB integration** with Mongoose (users, blog posts, sessions)
- **Secure credentials**: passwords are hashed with bcrypt (12 rounds) and never stored in plain text; sessions are stored in MongoDB with `httpOnly` cookies
- **Secrets in `.env`**: database URI and session secret are never committed
- **All blogs page**: every post is fetched from the database and listed newest first
- **Individual blog page** at `/blogs/:id` with author, date and full content
- **Authorization**: only logged-in users can write posts, and only the author can delete their own post
- Output escaping (EJS) to prevent XSS, input validation and 404/500 handling

## Tech stack

Node.js · Express · MongoDB · Mongoose · EJS · bcryptjs · express-session · connect-mongo

## Project structure

```
├── server.js            # app setup, DB connection, sessions
├── models/
│   ├── User.js          # user schema + password hashing
│   └── Blog.js          # blog schema (author references User)
├── routes/
│   ├── auth.js          # register / login / logout
│   └── blogs.js         # create, view single blog, delete
├── views/               # EJS templates
├── public/style.css
├── .env.example
└── package.json
```

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create a MongoDB database**
   - Local: install MongoDB Community and use `mongodb://127.0.0.1:27017/blogapp`, or
   - Cloud: create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas), add a database user, allow your IP under *Network Access*, and copy the connection string.
3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and set `MONGODB_URI` and a long random `SESSION_SECRET`.
4. **Run the app**
   ```bash
   npm start
   ```
   Open http://localhost:3000

## Routes

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/` | List all blogs from the database |
| GET | `/blogs/:id` | View a single blog's details |
| GET/POST | `/blogs/new`, `/blogs` | Write and publish a post (login required) |
| POST | `/blogs/:id/delete` | Delete your own post |
| GET/POST | `/register` | Create an account |
| GET/POST | `/login` | Log in |
| POST | `/logout` | Log out |

## Data model

**User**: `username`, `email`, `password` (bcrypt hash), timestamps
**Blog**: `title`, `content`, `author` (ref → User), timestamps

## Deploying

Set `MONGODB_URI` (Atlas) and `SESSION_SECRET` as environment variables on your host (Render, Railway, etc.) and use `npm start` as the start command.

## Author

Kanishka Atal — B.Tech CSE, Government Engineering College Bikaner
