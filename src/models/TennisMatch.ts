// models/TennisMatch.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { BaseMatchSchema } from "./BaseMatch";

export type TennisEventType =
  | "Smash"
  | "Ace"
  | "Drop"
  | "Net"
  | "Out"
  | "ServiceFault"
  | "BodyTouch";

export interface IRallyEvent {
  playerId: Types.ObjectId;
  eventType: TennisEventType;
  pointTo?: number; // which team gets the point (1 or 2)
  time?: string;
}

export interface IGame {
  gameNumber: number;
  team1Points: number;
  team2Points: number;
  winnerTeamId?: Types.ObjectId | null;
  rallyLog?: IRallyEvent[];
}

export interface ITennisMatch extends Document {
  games: IGame[];
  currentGame: number;
  toss?: {
    tossWinnerTeamId: Types.ObjectId;
    serveFirstTeamId: Types.ObjectId;
    sideOfServe: "left" | "right";
  };
  rules?: {
    matchType?: string; // "friendly" | "friendly cup" | "Exhibition" | "practice"
    surfaceType?: string; // "Synthetic" | "clay" | "grass" | "hard"
    numberOfSets?: number; // 3
    numberOfMatchesToDecideWinner?: number; // 1 or 2
    advantageRule?: boolean;
    finalSetTieBreak?: boolean;
    matchTieBreak?: boolean;
    superTieBreakPoints?: number; // 7 or 10
  } & Record<string, any>;
}

// --------------------- SCHEMAS --------------------- //

const RallyEventSchema = new Schema<IRallyEvent>(
  {
    playerId: { type: Schema.Types.ObjectId, required: true },
    eventType: {
      type: String,
      enum: ["Smash", "Ace", "Drop", "Net", "Out", "ServiceFault", "BodyTouch"],
      required: true,
    },
    pointTo: { type: Number },
    time: { type: String },
  },
  { _id: false }
);

const GameSchema = new Schema<IGame>(
  {
    gameNumber: { type: Number, required: true },
    team1Points: { type: Number, default: 0 },
    team2Points: { type: Number, default: 0 },
    winnerTeamId: { type: Schema.Types.ObjectId, default: null },
    rallyLog: { type: [RallyEventSchema], default: [] },
  },
  { _id: false }
);

const TossSchema = new Schema(
  {
    tossWinnerTeamId: { type: Schema.Types.ObjectId, required: true },
    serveFirstTeamId: { type: Schema.Types.ObjectId, required: true },
    sideOfServe: { type: String, enum: ["left", "right"], required: true },
  },
  { _id: false }
);

const RulesSchema = new Schema(
  {
    matchType: {
      type: String,
      enum: ["friendly", "friendly cup", "exhibition", "practice"],
    },
    surfaceType: {
      type: String,
      enum: ["synthetic", "clay", "grass", "hard"],
    },
    numberOfSets: { type: Number, default: 3 },
    numberOfMatchesToDecideWinner: { type: Number, default: 1 },
    advantageRule: { type: Boolean, default: true },
    finalSetTieBreak: { type: Boolean, default: true },
    matchTieBreak: { type: Boolean, default: true },
    superTieBreakPoints: { type: Number, default: 10 },
  },
  { _id: false }
);

// --------------------- MAIN SCHEMA --------------------- //

const TennisMatchSchema = new Schema<ITennisMatch>(
  {
    ...BaseMatchSchema.obj,

    games: { type: [GameSchema], default: [] },
    currentGame: { type: Number, default: 1 },
    toss: { type: TossSchema, default: null },
    rules: { type: RulesSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default
  mongoose.models.TennisMatch ||
  mongoose.model<ITennisMatch>("TennisMatch", TennisMatchSchema);
