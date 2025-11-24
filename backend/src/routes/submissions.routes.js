import { Router } from "express";
import { retrieveSubmissions, createSubmission } from "../controllers/submissions.controller.js";
import { verifyManagerToken } from "../middleware/authMiddleware.js";

const submissionsRouter = Router();

submissionsRouter.get('/', verifyManagerToken, retrieveSubmissions);
submissionsRouter.post('/', createSubmission);

export default submissionsRouter;