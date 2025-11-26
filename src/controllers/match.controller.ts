// src/controllers/match.controller.ts
import { Request, Response } from "express";
import { getMatchModel } from "../utils/matchModelResolver";

export const createMatch = async (req: Request, res: Response) => {
  try {
    console.log("Request Body:", req.body); // Debugging line
    const { sport, ...data } = req.body;
    const Model = getMatchModel(sport);
    const match = await Model.create({ sport, ...data });

    console.log("Created Match:", match); // Debugging line
    res.status(201).json({
      success:true,
      data: match,
      message: "Match created successfully"
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const getMatch = async (req: Request, res: Response) => {
  try {
    const { sport, id } = req.params;
    const Model = getMatchModel(sport);
    const match = await Model.findById(id)
      .populate({
        path: 'teams.players',
        model: 'User',
        select: 'name username email profilePicture mobile'
      })
      .populate({
        path: 'scoringUpdatedBy',
        model: 'User',
        select: 'name username email profilePicture'
      })
      .populate({
        path: 'createdBy',
        model: 'User',
        select: 'name username email profilePicture'
      })
      .populate({
        path: 'venueId',
        model: 'Venue',
        select: 'name address city state pincode contactNumber'
      })
      .populate({
        path: 'winner',
        model: 'Team',
        select: 'name logoUrl'
      });
    
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    
    return res.json(match);
  } catch (err) {
    console.error('Error fetching match:', err);
    return res.status(404).json({ error: "Match not found" });
  }
};