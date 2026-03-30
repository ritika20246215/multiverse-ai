import { Router } from "express";
import { completeQuest, generateQuests } from "../controllers/questController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.post("/generate", authMiddleware, generateQuests);
router.patch("/:questId/complete", authMiddleware, completeQuest);

export default router;
