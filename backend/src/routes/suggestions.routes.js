import { Router } from "express";
import { verifyManagerToken } from "../middleware/authMiddleware.js";
import { generateScheduleSuggestion } from "../controllers/suggestions.controller.js";

const suggestionsRouter = Router();

suggestionsRouter.post("/generate", verifyManagerToken, generateScheduleSuggestion);

export default suggestionsRouter;
