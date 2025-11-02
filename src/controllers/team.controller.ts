import { Request, Response } from "express";
import { Team } from "../models/Team";
import mongoose from "mongoose";

// ---------------- CREATE TEAM ----------------
export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, shortName, logoUrl, sport, players, createdBy } = req.body;

    if (!name || !sport) {
      return res.status(400).json({ message: "Team name and sport are required." });
    }

    const existing = await Team.findOne({ name: name.trim(), sport });
    if (existing) {
      return res.status(400).json({ message: "A team with this name already exists for this sport." });
    }

    const newTeam = new Team({
      name,
      shortName,
      logoUrl,
      sport: sport.toLowerCase(),
      players: players || [],
      createdBy,
    });

    await newTeam.save();
    return res.status(201).json({ success: true, data: newTeam });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Error creating team", error: err.message });
  }
};

// ---------------- GET ALL TEAMS BASED ON QUERY ----------------
export const getTeams = async (req: Request, res: Response) => {
  try {
    const { sport, createdBy, user } = req.query;

    const filter: any = {};
    if (sport) filter.sport = sport;
    if (createdBy) filter.createdBy = createdBy;
    if (user) filter.players = user;

    const teams = await Team.find(filter)
      .populate("players", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: teams });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching teams", error: err.message });
  }
};

// ---------------- GET SINGLE TEAM ----------------
export const getTeamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid team ID." });
    }

    const team = await Team.findById(id).populate("players", "name email mobile profilePic");
    if (!team) return res.status(404).json({ message: "Team not found." });

    return res.status(200).json({ success: true, data: team });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching team", error: err.message });
  }
};

// ---------------- UPDATE TEAM ----------------
export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, shortName, logoUrl, players } = req.body;

    const updated = await Team.findByIdAndUpdate(
      id,
      { name, shortName, logoUrl, players },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Team not found." });

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Error updating team", error: err.message });
  }
};

// ---------------- DELETE TEAM ----------------
// export const deleteTeam = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     const deleted = await Team.findByIdAndDelete(id);
//     if (!deleted) return res.status(404).json({ message: "Team not found." });

//     return res.status(200).json({ success: true, message: "Team deleted successfully." });
//   } catch (err: any) {
//     console.error(err);
//     return res.status(500).json({ message: "Error deleting team", error: err.message });
//   }
// };
