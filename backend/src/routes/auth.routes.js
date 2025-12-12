import { Router } from "express";
import { login, validateToken } from "../controllers/auth.controller.js";
import { verifyManagerToken } from "../middleware/authMiddleware.js";

const authRouter = Router();

// Login endpoint - no auth required
authRouter.post('/manager', login);

// Token validation endpoint - requires valid token
// This is lightweight: just checks JWT validity, no database queries
authRouter.get('/validate', verifyManagerToken, validateToken);

export default authRouter;