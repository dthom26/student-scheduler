import { Router } from "express";
import { login } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post('/manager', login);

export default authRouter;