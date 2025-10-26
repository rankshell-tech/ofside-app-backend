// models/VolleyballMatch.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { BaseMatchSchema } from "./BaseMatch";

export interface IVolleyballSet {
  setNumber: number;
  team1Score: number;
  team2Score: number;
  winnerTeamId?: Types.ObjectId | null;
}

export interface IVolleyballMatch extends Document {
  sets: IVolleyballSet[];      // array of sets (usually best of 5)
  currentSet: number;
  matchBestOf: number;         // 3 or 5
  totalSetsWon: { team1: number; team2: number };
  servingTeamId?: Types.ObjectId; // which team currently serving
  rotations?: any;            // optional rotation state if you implement it
  rules?: { maxPointsPerSet?: number; finalSetTo?: number; allowSubstitutions?: boolean } & Record<string, any>;
}

const VolleyballSetSchema = new Schema<IVolleyballSet>({
  setNumber: { type: Number, required: true },
  team1Score: { type: Number, default: 0 },
  team2Score: { type: Number, default: 0 },
  winnerTeamId: { type: Schema.Types.ObjectId, default: null }
}, { _id: false });

const VolleyballMatchSchema = new Schema<IVolleyballMatch>({
  ...BaseMatchSchema.obj,
  sets: { type: [VolleyballSetSchema], default: [] },
  currentSet: { type: Number, default: 1 },
  matchBestOf: { type: Number, default: 5 },
  totalSetsWon: { team1: { type: Number, default: 0 }, team2: { type: Number, default: 0 } },
  servingTeamId: { type: Schema.Types.ObjectId, default: null },
  rotations: { type: Schema.Types.Mixed, default: {} },
  rules: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.models.VolleyballMatch || mongoose.model("VolleyballMatch", VolleyballMatchSchema);
