// models/FootballMatch.ts
import mongoose, { Schema, Types } from "mongoose";
import { BaseMatchSchema, IBaseMatch } from "./BaseMatch";

export type FootballEventType =
  | "goal"
  | "own_goal"
  | "goal_saved"
  | "penalty_scored"
  | "penalty_missed"
  | "yellow_card"
  | "red_card"
  | "corner_kick"
  | "foul_free_kick"
  | "save"
  | "substitution"
  | "drinks_break"
  | "resume";

export interface IGoalEvent {
  minute: number;
  type: "goal" | "own_goal" | "penalty_scored" | "penalty_missed" | "goal_saved";
  teamId: Types.ObjectId;
  scorerId?: Types.ObjectId;
  assistId?: Types.ObjectId;
  description?: string;
}

export interface IFootballMatch extends IBaseMatch {
  halfDurationMinutes?: number;
  currentHalf?: 1 | 2 | 3 | 4;
  score: { team1: number; team2: number };

  goals: IGoalEvent[];
  yellowCards: Array<{ minute: number; playerId: Types.ObjectId; teamId: Types.ObjectId; reason?: string }>;
  redCards: Array<{ minute: number; playerId: Types.ObjectId; teamId: Types.ObjectId; reason?: string }>;
  substitutions: Array<{ minute: number; outPlayerId: Types.ObjectId; inPlayerId: Types.ObjectId; teamId: Types.ObjectId }>;

  extraTime?: { enabled: boolean; score?: { team1: number; team2: number } };
  penalties?: Array<{ playerId?: Types.ObjectId; converted: boolean; order: number; teamId: Types.ObjectId }>;

  toss?: {
    tossWinnerTeamId: Types.ObjectId;
    kickOffFirstTeamId: Types.ObjectId;
    sideOfServe: "left" | "right";
  };

  rules?: {
    matchType?: string;
    pitchType?: string;
    matchTotalDuration?: number;
    extraTime?: boolean;
    penaltyShootout?: boolean;
    playerSubstitute?: boolean;
    offsideRule?: boolean;
    cardsEnforcement?: boolean;
    freeKicks?: boolean;
    cornerKicks?: boolean;
    goalSize?: string;
    matchBreakDuration?: number;
  };
}

const GoalSchema = new Schema<IGoalEvent>(
  {
    minute: { type: Number, required: true },
    type: {
      type: String,
      enum: ["goal", "own_goal", "penalty_scored", "penalty_missed", "goal_saved"],
      default: "goal",
    },
    teamId: { type: Schema.Types.ObjectId, required: true },
    scorerId: { type: Schema.Types.ObjectId },
    assistId: { type: Schema.Types.ObjectId },
    description: { type: String },
  },
  { _id: false }
);

const FootballMatchSchema = new Schema<IFootballMatch>(
  {
    halfDurationMinutes: { type: Number, default: 45 },
    currentHalf: { type: Number, default: 1 },
    score: {
      team1: { type: Number, default: 0 },
      team2: { type: Number, default: 0 },
    },
    goals: { type: [GoalSchema], default: [] },
    yellowCards: {
      type: [{ minute: Number, playerId: Schema.Types.ObjectId, teamId: Schema.Types.ObjectId, reason: String }],
      default: [],
    },
    redCards: {
      type: [{ minute: Number, playerId: Schema.Types.ObjectId, teamId: Schema.Types.ObjectId, reason: String }],
      default: [],
    },
    substitutions: {
      type: [{ minute: Number, outPlayerId: Schema.Types.ObjectId, inPlayerId: Schema.Types.ObjectId, teamId: Schema.Types.ObjectId }],
      default: [],
    },
    extraTime: { type: { enabled: Boolean, score: { team1: Number, team2: Number } }, default: null },
    penalties: {
      type: [{ playerId: Schema.Types.ObjectId, converted: Boolean, order: Number, teamId: Schema.Types.ObjectId }],
      default: [],
    },
    toss: {
      tossWinnerTeamId: Schema.Types.ObjectId,
      kickOffFirstTeamId: Schema.Types.ObjectId,
      sideOfServe: { type: String, enum: ["left", "right"] },
    },
    rules: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

FootballMatchSchema.add(BaseMatchSchema);

export default mongoose.models.FootballMatch ||
  mongoose.model<IFootballMatch>("FootballMatch", FootballMatchSchema);
