import { Router } from "express";
import { analyzeUser } from "../controllers/analysisController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.post("/analyze-user", authMiddleware, analyzeUser);

export default router;
