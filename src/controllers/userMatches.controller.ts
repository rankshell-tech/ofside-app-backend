import { Request, Response } from "express";
import { getMatchModel } from "../utils/matchModelResolver";


/**
 * 🕒 Upcoming Matches
 * Route: GET /api/matches/upcoming?sport=football&userId=123
 */
export const getUpcomingMatches = async (req: Request, res: Response) => {
  try {
    const { sport, userId } = req.query;

    // ✅ Basic validation
    if (!sport || typeof sport !== "string") {
      return res.status(400).json({ success: false, message: "Sport is required" });
    }

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const Model = getMatchModel(sport);
    if (!Model) {
      return res.status(400).json({ success: false, message: "Unsupported sport" });
    }

    const now = new Date();

    // ✅ Find matches where this user is in either team and match hasn't started yet
    const matches = await Model.find({
      startAt: { $gt: now },
      $or: [
        { "teams.0.players": userId },
        { "teams.1.players": userId },
      ],
    }).lean();

    return res.json({
      success: true,
      message: "Upcoming matches fetched successfully",
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error("Error in getUpcomingMatches:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * 🏁 Past Matches
 * Route: GET /api/matches/past?sport=football&userId=123
 */
export const getPastMatches = async (req: Request, res: Response) => {
  try {
    const { sport, userId } = req.query;

    if (!sport || typeof sport !== "string") {
      return res.status(400).json({ success: false, message: "Sport is required" });
    }

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const Model = getMatchModel(sport);
    if (!Model) {
      return res.status(400).json({ success: false, message: "Unsupported sport" });
    }

    const now = new Date();

    // ✅ Find completed matches for the user
    const matches = await Model.find({
      status: "completed",
      endAt: { $lt: now },
      $or: [
        { "teams.0.players": userId },
        { "teams.1.players": userId },
      ],
    }).lean();

    return res.json({
      success: true,
      message: "Past matches fetched successfully",
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error("Error in getPastMatches:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ⚡ Current Matches (WebSocket placeholder)
 * Route: GET /api/matches/current
 */
export const getCurrentMatches = async (req: Request, res: Response) => {
    try {
        const { sport, userId } = req.query;

        if (!sport || typeof sport !== "string") {
            return res.status(400).json({ success: false, message: "Sport is required" });
        }

        if (!userId || typeof userId !== "string") {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const Model = getMatchModel(sport);
        if (!Model) {
            return res.status(400).json({ success: false, message: "Unsupported sport" });
        }

        const now = new Date();

        // Find a single ongoing match for the user (currently in progress by time bounds and/or status)
        const match = await Model.findOne({
            $or: [
                { "teams.0.players": userId },
                { "teams.1.players": userId },
            ],
            status: "ongoing",
            startAt: { $lte: now },
            endAt: { $gt: now },
        })
            .lean()
            .exec();

        if (!match) {
            return res.json({
                success: true,
                message: "No current match found for the user",
                match: null,
            });
        }

        return res.json({
            success: true,
            message: "Current match fetched successfully",
            match,
        });
    } catch (error) {
        console.error("Error in getCurrentMatch:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
