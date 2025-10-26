// models/BasketballMatch.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { BaseMatchSchema } from "./BaseMatch";

export interface IScoreEvent {
  quarter: number;
  time?: string;          // mm:ss or raw time
  playerId?: Types.ObjectId;
  teamId: Types.ObjectId;
  points: 1 | 2 | 3;
  description?: string;
}

export interface IBasketballMatch extends Document {
  // base properties from BaseMatchSchema
  quarters: number;       // e.g., 4
  quarterDurationMins?: number;
  scoreByQuarter: Array<{ team1: number; team2: number }>;
  totalScore: { team1: number; team2: number };
  fouls: Array<{ playerId: Types.ObjectId; teamId: Types.ObjectId; quarter: number; count: number }>;
  timeouts: Array<{ teamId: Types.ObjectId; quarter: number; minute: number }>;
  scoreEvents: IScoreEvent[];
  rules?: Record<string, any>;
}

const ScoreEventSchema = new Schema<IScoreEvent>({
  quarter: { type: Number, required: true },
  time: { type: String },
  playerId: { type: Schema.Types.ObjectId },
  teamId: { type: Schema.Types.ObjectId, required: true },
  points: { type: Number, enum: [1,2,3], required: true },
  description: { type: String }
}, { _id: false });

const BasketballMatchSchema = new Schema<IBasketballMatch>({
  ...BaseMatchSchema.obj,
  quarters: { type: Number, default: 4 },
  quarterDurationMins: { type: Number, default: 10 }, // or 12 depending on rules
  scoreByQuarter: { type: [{ team1: Number, team2: Number }], default: [] },
  totalScore: { team1: { type: Number, default: 0 }, team2: { type: Number, default: 0 } },
  fouls: { type: [{ playerId: Schema.Types.ObjectId, teamId: Schema.Types.ObjectId, quarter: Number, count: Number }], default: [] },
  timeouts: { type: [{ teamId: Schema.Types.ObjectId, quarter: Number, minute: Number }], default: [] },
  scoreEvents: { type: [ScoreEventSchema], default: [] },
  rules: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.models.BasketballMatch || mongoose.model("BasketballMatch", BasketballMatchSchema);
