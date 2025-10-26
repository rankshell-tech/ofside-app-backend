// models/BadmintonMatch.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { BaseMatchSchema } from "./BaseMatch";

export interface IGame {
  gameNumber: number;
  team1Points: number;
  team2Points: number;
  winnerTeamId?: Types.ObjectId | null;
  rallyLog?: Array<{ serverId?: Types.ObjectId; receiverId?: Types.ObjectId; pointTo: number; time?: string }>;
}

export interface IBadmintonMatch extends Document {
  bestOf: number;          // usually 3
  games: IGame[];
  currentGame: number;
  rules?: {
    pointsToWin?: number;  // 21
    winBy?: number;        // 2
    capAt?: number;        // 30
  } & Record<string, any>;
}

const GameSchema = new Schema<IGame>({
  gameNumber: { type: Number, required: true },
  team1Points: { type: Number, default: 0 },
  team2Points: { type: Number, default: 0 },
  winnerTeamId: { type: Schema.Types.ObjectId, default: null },
  rallyLog: { type: [{ serverId: Schema.Types.ObjectId, receiverId: Schema.Types.ObjectId, pointTo: Number, time: String }], default: [] }
}, { _id: false });

const BadmintonMatchSchema = new Schema<IBadmintonMatch>({
  ...BaseMatchSchema.obj,
  bestOf: { type: Number, default: 3 },
  games: { type: [GameSchema], default: [] },
  currentGame: { type: Number, default: 1 },
  rules: { type: Schema.Types.Mixed, default: { pointsToWin: 21, winBy: 2, capAt: 30 } }
}, { timestamps: true });

export default mongoose.models.BadmintonMatch || mongoose.model("BadmintonMatch", BadmintonMatchSchema);
