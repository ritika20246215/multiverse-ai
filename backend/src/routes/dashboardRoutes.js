import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, getDashboard);

export default router;
