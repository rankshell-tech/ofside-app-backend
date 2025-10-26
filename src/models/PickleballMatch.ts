// models/PickleballMatch.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { BaseMatchSchema } from "./BaseMatch";

export interface IPickleballGame {
  gameNumber: number;
  team1Points: number;
  team2Points: number;
  winnerTeamId?: Types.ObjectId | null;
}

export interface IPickleballMatch extends Document {
  bestOf: number;                // usually 3
  games: IPickleballGame[];
  currentGame: number;
  rules?: {
    pointsToWin?: number;        // commonly 11 (win by 2)
    winBy?: number;
    capAt?: number;
  } & Record<string, any>;
}

const PickleballGameSchema = new Schema<IPickleballGame>({
  gameNumber: { type: Number, required: true },
  team1Points: { type: Number, default: 0 },
  team2Points: { type: Number, default: 0 },
  winnerTeamId: { type: Schema.Types.ObjectId, default: null }
}, { _id: false });

const PickleballMatchSchema = new Schema<IPickleballMatch>({
  ...BaseMatchSchema.obj,
  bestOf: { type: Number, default: 3 },
  games: { type: [PickleballGameSchema], default: [] },
  currentGame: { type: Number, default: 1 },
  rules: { type: Schema.Types.Mixed, default: { pointsToWin: 11, winBy: 2 } }
}, { timestamps: true });

export default mongoose.models.PickleballMatch || mongoose.model("PickleballMatch", PickleballMatchSchema);
