import { Router } from "express";
import { retrieveSubmissions, createSubmission, getSubmissionByStudentId, updateSubmission } from "../controllers/submissions.controller.js";
import { verifyManagerToken } from "../middleware/authMiddleware.js";

const submissionsRouter = Router();

submissionsRouter.get('/', verifyManagerToken, retrieveSubmissions);
submissionsRouter.post('/', createSubmission);
submissionsRouter.get('/:studentId', getSubmissionByStudentId);
submissionsRouter.put('/:studentId', updateSubmission);

export default submissionsRouter;