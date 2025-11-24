# Local Development Setup

## Running the App Locally

### 1. Start the Backend (Terminal 1)
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:3001`

### 2. Start the Frontend (Terminal 2)
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

The frontend will automatically use `http://localhost:3001` for API calls (from `.env.local`)

---

## Environment Variables

### Frontend
- **`.env.local`** (gitignored) - Used for local development with `npm run dev`
  - Contains: `VITE_API_BASE_URL=http://localhost:3001`
  
- **`.env`** (committed) - Used for production builds with `npm run build`
  - Contains: `VITE_API_BASE_URL=https://student-schedular-backend.onrender.com`

### Backend
- **`.env.development.local`** (gitignored) - Used when running `npm run dev`
  - Local MongoDB connection, development JWT secret
  
- **`.env.production.local`** (gitignored) - Template for production
  - Actual production values set in Render dashboard

---

## Deployment

### Deploy Frontend to GitHub Pages
```bash
npm run deploy
```
Uses the production URL from `.env`

### Deploy Backend to Render
- Push changes to GitHub
- Render auto-deploys from the `backend/` folder
- Environment variables set in Render dashboard

---

## Testing the Full Stack Locally

1. Make sure MongoDB Atlas allows your IP address
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `npm run dev` (in root directory)
4. Open browser: `http://localhost:5173`

**Student Mode**: Submit availability  
**Manager Mode**: Login with password (from backend `.env.development.local`)
