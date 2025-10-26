// models/BaseMatch.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type MatchStatus = "scheduled" | "live" | "paused" | "completed" | "cancelled";

export interface IPlayerRef {
  _id: Types.ObjectId; // reference to Player collection (optional)
  name: string;
  number?: string | number;
  position?: string;
}

export interface ITeamRef {
  _id?: Types.ObjectId; // optional reference to Team collection
  name: string;
  shortName?: string;
  logoUrl?: string;
  players?: IPlayerRef[];
  coach?: string;
}

export interface IBaseMatch extends Document {
  sport: string;                     // "Football" | "Volleyball" | ...
  format?: string;                   // "Team", "Doubles", "Singles", etc. (from frontend selectedFormat)
  tournament?: boolean;
  title?: string;
  startAt?: Date;
  durationMinutes?: number;          // matchDuration from UI (mins)
  location?: string;
  venueId?: Types.ObjectId;
  status: MatchStatus;
  teams: [ITeamRef, ITeamRef];      // always two-side structure (home/away or team1/team2)
  referee?: string;
  umpire?: string;
  createdBy?: Types.ObjectId;
  rules?: Record<string, any>;       // sport-specific rules/settings from MatchRulesScreen
  feed?: Array<{                     // match feed / event log (maps to feeds in UI)
    time?: string;                   // "12'" or ISO-time or mm:ss
    type: string;                    // "goal", "point", "sub", "timeout", ...
    description?: string;
    teamId?: Types.ObjectId;         // which team
    playerId?: Types.ObjectId;       // which player
    meta?: Record<string, any>;      // extra contextual data (assist, cardType, minute etc)
    createdAt?: Date;
  }>;
  winner?: Types.ObjectId | null;    // reference to winning team (team._id) or null
  meta?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export const PlayerRefSchema = new Schema<IPlayerRef>({
  _id: { type: Schema.Types.ObjectId, required: false },
  name: { type: String, required: true },
  number: { type: Schema.Types.Mixed },
  position: { type: String },
}, { _id: false });

export const TeamRefSchema = new Schema<ITeamRef>({
  _id: { type: Schema.Types.ObjectId, required: false },
  name: { type: String, required: true },
  shortName: { type: String },
  logoUrl: { type: String },
  players: { type: [PlayerRefSchema], default: [] },
  coach: { type: String },
}, { _id: false });

export const BaseMatchSchema = new Schema<IBaseMatch>({
  sport: { type: String, required: true },
  format: { type: String },
  tournament: { type: Boolean, default: false },
  title: { type: String },
  startAt: { type: Date },
  durationMinutes: { type: Number },
  location: { type: String },
  venueId: { type: Schema.Types.ObjectId },
  status: { type: String, default: "scheduled" },
  teams: { type: [TeamRefSchema], required: true, validate: [(v: any[]) => v.length === 2, "Teams must be length 2"] },
  referee: { type: String },
  umpire: { type: String },
  createdBy: { type: Schema.Types.ObjectId },
  rules: { type: Schema.Types.Mixed, default: {} },
  feed: { type: [{ time: String, type: String, description: String, teamId: Schema.Types.ObjectId, playerId: Schema.Types.ObjectId, meta: Schema.Types.Mixed, createdAt: { type: Date, default: Date.now } }], default: [] },
  winner: { type: Schema.Types.ObjectId, default: null },
  meta: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.models.BaseMatch || mongoose.model<IBaseMatch>("BaseMatch", BaseMatchSchema);
