import express from "express";
import {
  getUpcomingMatches,
  getPastMatches,
  getCurrentMatches,
} from "../controllers/userMatches.controller";

const router = express.Router();

// ✅ Define routes
router.get("/upcoming", getUpcomingMatches);
router.get("/past", getPastMatches);
router.get("/current", getCurrentMatches);

export default router;
