import { Router } from "express";
import { getAvailabilityTypes, updateAvailabilityTypes } from "../controllers/availabilityTypes.controller.js";
import { verifyManagerToken } from "../middleware/authMiddleware.js";

const availabilityTypesRouter = Router();

availabilityTypesRouter.get("/", getAvailabilityTypes);
availabilityTypesRouter.put("/", verifyManagerToken, updateAvailabilityTypes);

export default availabilityTypesRouter;
