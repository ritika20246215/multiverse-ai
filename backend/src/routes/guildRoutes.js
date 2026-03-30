import { Router } from "express";
import { createGuild, joinGuild, listGuilds } from "../controllers/guildController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, listGuilds);
router.post("/", authMiddleware, createGuild);
router.post("/:guildId/join", authMiddleware, joinGuild);

export default router;
