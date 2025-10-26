// src/controllers/match.controller.ts
import { Request, Response } from "express";
import { getMatchModel } from "../utils/matchModelResolver";

export const createMatch = async (req: Request, res: Response) => {
  try {
    const { sport, ...data } = req.body;
    const Model = getMatchModel(sport);
    const match = await Model.create({ sport, ...data });
    res.status(201).json(match);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const getMatch = async (req: Request, res: Response) => {
  try {
    const { sport, id } = req.params;
    const Model = getMatchModel(sport);
    const match = await Model.findById(id);
    res.json(match);
  } catch (err) {
    res.status(404).json({ error: "Match not found" });
  }
};