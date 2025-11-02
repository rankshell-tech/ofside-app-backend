import express from "express";
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam

} from "../controllers/team.controller";

const router = express.Router();

router.post("/", createTeam);
router.get("/", getTeams);
router.get("/:id", getTeamById);
router.put("/:id", updateTeam);

export default router;
