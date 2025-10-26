// models/TennisMatch.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { BaseMatchSchema } from "./BaseMatch";

export interface IGamePoint {
  pointNumber: number;
  winnerTeamId: Types.ObjectId;
  serverTeamId?: Types.ObjectId;
  description?: string;
  time?: string;
}

export interface ISet {
  setNumber: number;
  team1Games: number;
  team2Games: number;
  tieBreak?: { team1: number; team2: number } | null;
  winnerTeamId?: Types.ObjectId | null;
  gamePoints?: IGamePoint[]; // optional detailed point log
}

export interface ITennisMatch extends Document {
  bestOfSets: number; // best of 3 or 5
  sets: ISet[];
  currentSet: number;
  rules?: {
    tiebreakAt?: number; // games count at which tiebreak applies (6)
    finalSetTiebreak?: boolean;
  } & Record<string, any>;
}

const GamePointSchema = new Schema<IGamePoint>({
  pointNumber: { type: Number },
  winnerTeamId: { type: Schema.Types.ObjectId, required: true },
  serverTeamId: { type: Schema.Types.ObjectId },
  description: { type: String },
  time: { type: String }
}, { _id: false });

const SetSchema = new Schema<ISet>({
  setNumber: { type: Number, required: true },
  team1Games: { type: Number, default: 0 },
  team2Games: { type: Number, default: 0 },
  tieBreak: { type: { team1: Number, team2: Number }, default: null },
  winnerTeamId: { type: Schema.Types.ObjectId, default: null },
  gamePoints: { type: [GamePointSchema], default: [] }
}, { _id: false });

const TennisMatchSchema = new Schema<ITennisMatch>({
  ...BaseMatchSchema.obj,
  bestOfSets: { type: Number, default: 3 },
  sets: { type: [SetSchema], default: [] },
  currentSet: { type: Number, default: 1 },
  rules: { type: Schema.Types.Mixed, default: { tiebreakAt: 6, finalSetTiebreak: true } }
}, { timestamps: true });

export default mongoose.models.TennisMatch || mongoose.model("TennisMatch", TennisMatchSchema);
