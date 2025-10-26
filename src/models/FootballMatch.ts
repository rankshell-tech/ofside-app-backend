// models/FootballMatch.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { BaseMatchSchema, IBaseMatch, TeamRefSchema } from "./BaseMatch";

export interface IGoalEvent {
  minute: number;
  type: "goal" | "own_goal" | "penalty" | "disallowed" | "goal_saved";
  scorer?: Types.ObjectId | { name: string };
  assist?: Types.ObjectId | { name: string };
  teamId: Types.ObjectId;
  description?: string;
}

export interface IFootballMatch extends IBaseMatch {
  halfDurationMinutes?: number;
  currentHalf?: 1 | 2 | 3 | 4; // 3/4 used for extra time etc
  score: {
    [teamId: string]: number; // teamId mapped to goals OR use teamIndices team0/team1
    team1: number;
    team2: number;
  };
  goals: IGoalEvent[];
  yellowCards: Array<{ minute: number; playerId: Types.ObjectId; teamId: Types.ObjectId; reason?: string }>;
  redCards: Array<{ minute: number; playerId: Types.ObjectId; teamId: Types.ObjectId; reason?: string }>;
  substitutions: Array<{ minute: number; outPlayerId: Types.ObjectId; inPlayerId: Types.ObjectId; teamId: Types.ObjectId }>;
  extraTime?: {
    enabled: boolean;
    score?: { team1: number; team2: number };
  };
  penalties?: Array<{ playerId?: Types.ObjectId; converted: boolean; order: number; teamId: Types.ObjectId }>;
  rules?: {
    extraTime?: boolean;
    penalties?: boolean;
    offsides?: boolean;
    // more keys as in your matchRules UI
  };
}

const GoalSchema = new Schema<IGoalEvent>({
  minute: { type: Number, required: true },
  type: { type: String, enum: ["goal", "own_goal", "penalty", "disallowed", "goal_saved"], default: "goal" },
  scorer: { type: Schema.Types.ObjectId, required: false },
  assist: { type: Schema.Types.ObjectId, required: false },
  teamId: { type: Schema.Types.ObjectId, required: true },
  description: { type: String }
}, { _id: false });

const FootballMatchSchema = new Schema<IFootballMatch>({


  halfDurationMinutes: { type: Number, default: 45 },
  currentHalf: { type: Number, default: 1 },
  score: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  goals: { type: [GoalSchema], default: [] },
  yellowCards: { type: [{ minute: Number, playerId: Schema.Types.ObjectId, teamId: Schema.Types.ObjectId, reason: String }], default: [] },
  redCards: { type: [{ minute: Number, playerId: Schema.Types.ObjectId, teamId: Schema.Types.ObjectId, reason: String }], default: [] },
  substitutions: { type: [{ minute: Number, outPlayerId: Schema.Types.ObjectId, inPlayerId: Schema.Types.ObjectId, teamId: Schema.Types.ObjectId }], default: [] },
  extraTime: { type: { enabled: Boolean, score: { team1: Number, team2: Number } }, default: null as any },
  penalties: { type: [{ playerId: Schema.Types.ObjectId, converted: Boolean, order: Number, teamId: Schema.Types.ObjectId }], default: [] },
  rules: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

FootballMatchSchema.add(BaseMatchSchema);

export default mongoose.models.FootballMatch || mongoose.model<IFootballMatch>("FootballMatch", FootballMatchSchema);
