# Majestic Core — Setup & Run Guide

## What you need installed
- XAMPP (for MySQL only — Apache is NOT needed)
- Node.js (https://nodejs.org) — v18 or higher

---

## Step 1 — Create the Database

1. Open XAMPP Control Panel → Start **MySQL**
2. Open your browser → go to http://localhost/phpmyadmin
3. Click **Import** in the top menu
4. Click **Choose File** → select `backend/db.sql`
5. Click **Go** at the bottom

---

## Step 2 — Configure Database credentials

Open `backend/.env` and make sure these match your MySQL setup:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=        ← leave empty if you have no MySQL password
DB_NAME=majestic_core
```

---

## Step 3 — Run the Backend (API)

Open a terminal in the `majestic-core` folder and run:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Majestic Core API running on http://localhost:5000
```

---

## Step 4 — Run the Frontend (React)

Open a **second terminal** in the `majestic-core` folder and run:

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE ready in ...ms
  ➜  Local: http://localhost:5173/
```

---

## Step 5 — Open the website

| Page        | URL                                    |
|-------------|----------------------------------------|
| Store       | http://localhost:5173                  |
| Admin Login | http://localhost:5173/admin/login      |
| Dashboard   | http://localhost:5173/admin/dashboard  |

---

## Default Admin Credentials

| Field    | Value       |
|----------|-------------|
| Username | magestic    |
| Password | core123     |

---

## Project Structure

```
majestic-core/
├── backend/
│   ├── server.js      ← Express API (all routes)
│   ├── db.js          ← MySQL connection pool
│   ├── db.sql         ← Run this in phpMyAdmin
│   ├── .env           ← DB credentials & secrets
│   └── uploads/       ← Product images stored here
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx          ← Storefront
        │   ├── ProductDetail.jsx ← Single product
        │   ├── AdminLogin.jsx    ← Admin login
        │   └── Dashboard.jsx     ← Admin panel
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   ├── Sidebar.jsx
        │   ├── ProductCard.jsx
        │   └── ProtectedRoute.jsx
        ├── context/AuthContext.jsx
        ├── api.js         ← Axios instance
        └── index.css      ← All styles
```
