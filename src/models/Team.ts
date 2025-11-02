import mongoose, { Schema, Document, Types } from "mongoose";

import { IUserDocument } from "./User";

export interface ITeam extends Document {
  name: string;
  shortName?: string;
  logoUrl?: string;
  players: Types.ObjectId[] | IUserDocument[];
  sport: string; // football, badminton, basketball, etc.
  createdBy?: Types.ObjectId; // who created it (admin/user)
  createdAt?: Date;
  updatedAt?: Date;
  captain?: Types.ObjectId | IUserDocument; // reference to the captain player
}

export const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    shortName: { type: String },
    logoUrl: { type: String },
    sport: { type: String, required: true, enum: ["football", "badminton", "basketball", "tennis", "volleyball", "pickleball"] },
    players: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    captain: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Index for performance filtering
TeamSchema.index({ sport: 1, name: 1 });

export const Team = mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);
