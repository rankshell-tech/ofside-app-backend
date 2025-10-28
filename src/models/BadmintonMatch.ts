// models/BadmintonMatch.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { BaseMatchSchema } from "./BaseMatch";

export type BadmintonEventType = 'Smash' | 'Drop' | 'Net' | 'Out' | 'ServiceFault' | 'BodyTouch';

export interface IRallyEvent {
  playerId: Types.ObjectId;
  eventType: BadmintonEventType;
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

export interface IBadmintonMatch extends Document {
  games: IGame[];
  currentGame: number;
  toss?: {
    tossWinnerTeamId: Types.ObjectId; 
    serveFirstTeamId: Types.ObjectId;
    sideOfServe: 'left' | 'right';
  }
  rules?: {
    matchType?: string; // "friendly" | "friendly cup" | "Exhibition" | "practice"
    numberOfSets?: number;  // 3
    pointerPerSet?: number;  // 21
  } & Record<string, any>;
}

const RallyEventSchema = new Schema<IRallyEvent>({
  playerId: { type: Schema.Types.ObjectId, required: true },
  eventType: { 
    type: String, 
    enum: ['Smash', 'Drop', 'Net', 'Out', 'ServiceFault', 'BodyTouch'], 
    required: true 
  },
  pointTo: { type: Number },
  time: { type: String }
}, { _id: false });

const GameSchema = new Schema<IGame>({
  gameNumber: { type: Number, required: true },
  team1Points: { type: Number, default: 0 },
  team2Points: { type: Number, default: 0 },
  winnerTeamId: { type: Schema.Types.ObjectId, default: null },
  rallyLog: { type: [RallyEventSchema], default: [] }
}, { _id: false });

const BadmintonMatchSchema = new Schema<IBadmintonMatch>({
  ...BaseMatchSchema.obj,

  games: { type: [GameSchema], default: [] },
  currentGame: { type: Number, default: 1 },
  rules: { type: Schema.Types.Mixed, default: { pointsToWin: 21, numberOfSets: 3, pointerPerSet: 21 } }
}, { timestamps: true });

export default mongoose.models.BadmintonMatch || mongoose.model("BadmintonMatch", BadmintonMatchSchema);
