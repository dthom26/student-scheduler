import { Router } from "express";
import {
  listDraftsByLocation,
  getDraftById,
  createDraft,
  updateDraft,
  deleteDraft,
} from "../controllers/draft.controller.js";
import { verifyManagerToken } from "../middleware/authMiddleware.js";

const draftsRouter = Router();

draftsRouter.get("/", verifyManagerToken, listDraftsByLocation);
draftsRouter.get("/:id", verifyManagerToken, getDraftById);
draftsRouter.post("/", verifyManagerToken, createDraft);
draftsRouter.put("/:id", verifyManagerToken, updateDraft);
draftsRouter.delete("/:id", verifyManagerToken, deleteDraft);

export default draftsRouter;
