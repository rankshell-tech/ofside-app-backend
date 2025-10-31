import { Request, Response } from "express";
import mongoose from "mongoose";

// Import all sport models
import FootballMatch from "../models/FootballMatch";
import BadmintonMatch from "../models/BadmintonMatch";
import BasketballMatch from "../models/BasketballMatch";
import TennisMatch from "../models/TennisMatch";
import VolleyballMatch from "../models/VolleyballMatch";
import PickleballMatch from "../models/PickleballMatch";
import { getBasketballLeaderboard, getFootballLeaderboard, getRacketSportLeaderboard } from "../utils/leaderboard";

// Map sport names to models
const sportModelMap: Record<string, mongoose.Model<any>> = {
  football: FootballMatch,
  badminton: BadmintonMatch,
  basketball: BasketballMatch,
  tennis: TennisMatch,
  volleyball: VolleyballMatch,
  pickleball: PickleballMatch,
};

/**
 * @desc Generate leaderboard for given sport
 * @route GET /api/leaderboard?sport=football
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { sport } = req.query;

    if (!sport || typeof sport !== "string") {
      return res.status(400).json({ success: false, message: "Sport is required" });
    }

    const Model = sportModelMap[sport.toLowerCase()];
    if (!Model) {
      return res.status(400).json({ success: false, message: "Unsupported sport type" });
    }

    let leaderboard: any[] = [];

    switch (sport.toLowerCase()) {
      case "football":
        leaderboard = await getFootballLeaderboard(Model);
        break;

      case "badminton":
      case "pickleball":
      case "volleyball":
      case "tennis":
        leaderboard = await getRacketSportLeaderboard(Model);
        break;

      case "basketball":
        leaderboard = await getBasketballLeaderboard(Model);
        break;

      default:
        leaderboard = [];
    }

    res.json({ success: true, sport, leaderboard });
  } catch (err) {
    console.error("❌ Leaderboard Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
