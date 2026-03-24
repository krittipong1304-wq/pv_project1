# FloorCraft Full-Stack Setup

This project is now clearly split into:

- `frontend/`: Vite + React client
- `backend/`: Express API
- `database`: MongoDB, connected through Mongoose

## Project structure

- `frontend/src/` React frontend
- `frontend/public/` static files
- `frontend/index.html` Vite entry HTML
- `backend/server.js` Express entry point
- `backend/models/Project.js` MongoDB model
- `backend/data/sampleProjects.js` starter seed data

## Environment setup

1. Copy `.env.example` to `.env`
2. Update `MONGODB_URI` if your MongoDB server uses a different URL

Example:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/floorcraft
PORT=5000
VITE_API_URL=http://localhost:5000
```

## Run the app

Before starting the backend, make sure MongoDB is running locally on `127.0.0.1:27017`.

Start backend:

```bash
npm run dev:backend
```

Note: on some macOS setups, Node's native `--watch` mode can fail with `EMFILE`, so the backend dev script runs without file watching for reliability.

Start frontend in another terminal:

```bash
npm run dev:frontend
```

Vite now uses `frontend/` as its app root, so the separation is physical as well as logical.

## macOS helpers

This repo includes Windows `.bat` launchers and macOS/Linux shell launchers:

- `./start-backend.sh`
- `./start-frontend.sh`
- `./start-app.sh`

For macOS Finder, you can also use:

- `./start-backend.command`
- `./start-frontend.command`
- `./start-app.command`

If the backend does not start, check these two common causes first:

1. `.env` is missing
2. MongoDB is not running locally

## Available API endpoints

- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`

When the backend connects to MongoDB for the first time and the `projects` collection is empty, it seeds sample data automatically.
