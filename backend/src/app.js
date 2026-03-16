import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PORT } from "./config/env.js";
import connectDB from "./database/mongodb.js";
import errorMiddleware from "./middleware/error.middleware.js";
import authRouter from "./routes/auth.routes.js";
import submissionsRouter from "./routes/submissions.routes.js";
import draftsRouter from "./routes/draft.routes.js";
import rulesRouter from "./routes/rules.routes.js";
import suggestionsRouter from "./routes/suggestions.routes.js";
import availabilityTypesRouter from "./routes/availabilityTypes.routes.js";
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(morgan("combined")); // Logging
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Local development (Vite default)
      "http://localhost:5174", // Local development (alternate port)
      "https://dthom26.github.io", // GitHub Pages
    ],
    credentials: true,
  })
); // Enable CORS for frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// TODO: Define API routes here (e.g., submissions, auth)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/submissions", submissionsRouter);
app.use("/api/v1/drafts", draftsRouter);
app.use("/api/v1/rules", rulesRouter);
app.use("/api/v1/suggestions", suggestionsRouter);
app.use("/api/v1/availability-types", availabilityTypesRouter);

app.get("/", (req, res) => {
  res.send("Student Scheduler Backend is running!");
});

app.get("/ping", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use(errorMiddleware);

// Connect to DB first, then start listening so no requests are
// accepted before the database is ready.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

export default app;
