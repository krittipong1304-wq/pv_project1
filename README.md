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

Start backend:

```bash
npm run dev:backend
```

Start frontend in another terminal:

```bash
npm run dev:frontend
```

Vite now uses `frontend/` as its app root, so the separation is physical as well as logical.

## Available API endpoints

- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`

When the backend connects to MongoDB for the first time and the `projects` collection is empty, it seeds sample data automatically.
