# Majestic Core

Majestic Core is a full-stack commerce application. The frontend and backend remain in their own folders, while **one root-level `package.json` and `package-lock.json` manage the whole project**.

## Technology

- **Frontend:** React, React Router, Vite, Axios, Stripe Elements
- **Backend:** Node.js, Express, MongoDB through Mongoose, sessions, Multer uploads, Stripe
- **Product images:** stored in `backend/uploads/` and served by the API at `/uploads`

## Requirements

- Node.js **20.19+** or **22.12+**
- npm
- A reachable MongoDB database
- Stripe keys for payment processing

## 1. Install all dependencies once

Run this from the repository root (the folder containing this README):

```bash
npm install
```

Do not run separate installs inside `backend/` or `frontend/`. All application and development dependencies are managed by the root manifest.

## 2. Configure environment variables

Keep the existing environment file locations:

**`backend/.env`**

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
SESSION_SECRET=replace-with-a-long-random-secret
STRIPE_SECRET_KEY=sk_test_replace_with_your_secret_key
```

**`frontend/.env`**

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_replace_with_your_publishable_key
```

Use your real MongoDB and Stripe values. Never commit real credentials. The backend explicitly loads `backend/.env`, even when commands are started from the repository root.

## 3. Run frontend and backend together

```bash
npm run dev
```

This starts both services. Press **Ctrl+C** once to stop both.

- Storefront: http://localhost:5173
- Admin login: http://localhost:5173/admin/login
- API: http://localhost:5000

## Other commands

| Command | Purpose |
| --- | --- |
| `npm run dev:backend` | Run the API with automatic restart |
| `npm run dev:frontend` | Run the Vite development server |
| `npm start` | Start the backend API for production |
| `npm run build` | Build the React frontend into `frontend/dist/` |
| `npm run preview` | Preview the production frontend build |
| `npm run lint` | Lint the frontend source |
| `npm run check` | Check backend syntax, lint frontend, and build frontend |

For a production deployment, configure the hosting platform's environment variables and use the existing backend/frontend deployment paths required by that platform.

## Project structure

```
magestic_core/
├── package.json
├── package-lock.json
├── scripts/
│   └── dev.js
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── db.sql
│   └── uploads/
└── frontend/
    ├── index.html
    ├── vite.config.mjs
    ├── public/
    └── src/
        ├── components/
        ├── context/
        └── pages/
```

Existing backend routes, MongoDB models, frontend pages, static assets, payment setup documentation, and uploaded product images are retained.

## Security note

Environment files were already present in the repository before this package-management change. Because credentials in a public repository should be treated as exposed, rotate the MongoDB credentials, Stripe secret key, and session secret, then keep the replacement values only in local environment files or your hosting provider's secret settings.
