import mongoose, { Schema, Document, Types } from "mongoose";

import { IUserDocument } from "./User";

export interface ITeam extends Document {
  name: string;
  description:string;
  logoUrl?: string;
  players: Types.ObjectId[] | IUserDocument[];
  sport: string; // football, badminton, basketball, etc.
  createdBy?: Types.ObjectId; // who created it (admin/user)
  createdAt?: Date;
  updatedAt?: Date;
  wins?: number;
  losses?: number;
  draws?: number;
  matches?: number;
  homeGround?: string;
  city?: string;
  captain?: Types.ObjectId | IUserDocument; // reference to the captain player
}

export const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String },
    sport: { type: String, required: true, enum: ["football", "badminton", "basketball", "tennis", "volleyball", "pickleball"] },
    players: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    captain: { type: Schema.Types.ObjectId, ref: "User" },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    matches: { type: Number, default: 0 },
    homeGround: { type: String },
    city: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

// Index for performance filtering
TeamSchema.index({ sport: 1, name: 1 });

export const Team = mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);
