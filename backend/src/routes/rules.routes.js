import { Router } from "express";
import { getRules, updateRules } from "../controllers/rules.controller.js";
import { verifyManagerToken } from "../middleware/authMiddleware.js";

const rulesRouter = Router();

rulesRouter.get("/", getRules);
rulesRouter.put("/", verifyManagerToken, updateRules);

export default rulesRouter;
