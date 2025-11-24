import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import {PORT} from './config/env.js';
import connectDB from './database/mongodb.js';
import errorMiddleware from './middleware/error.middleware.js';
import authRouter from './routes/auth.routes.js';
import submissionsRouter from './routes/submissions.routes.js';
const app = express();

// Middleware
app.use(helmet());  // Security headers
app.use(morgan('combined'));  // Logging
app.use(cors({
  origin: [
    'http://localhost:5173',  // Local development
    'https://dthom26.github.io'  // GitHub Pages
  ],
  credentials: true
}));  // Enable CORS for frontend
app.use(express.json());  // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies

// TODO: Define API routes here (e.g., submissions, auth)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/submissions', submissionsRouter);

app.get('/', (req, res) => {
  res.send('Student Scheduler Backend is running!');
});

app.use(errorMiddleware);

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectDB();
});

export default app;