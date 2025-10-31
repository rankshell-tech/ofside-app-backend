// models/BaseMatch.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { IUser } from "../types";

export type MatchStatus = "scheduled" | "live" | "paused" | "completed" | "cancelled";


export interface ITeamRef {
  _id?: Types.ObjectId; // optional reference to Team collection
  name: string;
  shortName?: string;
  logoUrl?: string;
  players?: IUser[];
}

export interface IBaseMatch extends Document {
  sport: string;                     // "Football" | "Volleyball" | ...
  format?: string;                   // "Team", "Doubles", "Singles","Two Players - mainly for volleyball" etc. (from frontend selectedFormat)
  tournament?: boolean;
  startAt?: Date;
  durationMinutes?: number;          // matchDuration from UI (mins)
  location?: string;
  venueId?: Types.ObjectId;
  status: MatchStatus;
  teams: [ITeamRef, ITeamRef];      // always two-side structure (home/away or team1/team2)
  // referee?: string;
  scoringUpdatedBy?: IUser[];
  // umpire?: string;
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



export const TeamRefSchema = new Schema<ITeamRef>({
  _id: { type: Schema.Types.ObjectId, required: false },
  name: { type: String, required: true },
  shortName: { type: String },
  logoUrl: { type: String },
  players: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
 
}, { _id: false });

export const BaseMatchSchema = new Schema<IBaseMatch>({
  sport: { type: String, required: true },
  format: { type: String },
  tournament: { type: Boolean, default: false },

  startAt: { type: Date },
  durationMinutes: { type: Number },
  location: { type: String },
  venueId: { type: Schema.Types.ObjectId },
  status: { type: String, default: "scheduled" },
  teams: { type: [TeamRefSchema], required: true, validate: [(v: any[]) => v.length === 2, "Teams must be length 2"] },
  // referee: { type: String },
  // umpire: { type: String },
  scoringUpdatedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
  createdBy: { type: Schema.Types.ObjectId },
  rules: { type: Schema.Types.Mixed, default: {} },
  feed: { type: [{ time: String, type: String, description: String, teamId: Schema.Types.ObjectId, playerId: Schema.Types.ObjectId, meta: Schema.Types.Mixed, createdAt: { type: Date, default: Date.now } }], default: [] },
  winner: { type: Schema.Types.ObjectId, default: null },
  meta: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.models.BaseMatch || mongoose.model<IBaseMatch>("BaseMatch", BaseMatchSchema);



// want it for all 

// // models/BaseMatch.ts
// import mongoose, { Schema, Document, Types } from "mongoose";
// import { IUser } from "../types";

// export type MatchStatus = "scheduled" | "live" | "paused" | "completed" | "cancelled";


// export interface ITeamRef {
//   _id?: Types.ObjectId; // optional reference to Team collection
//   name: string;
//   shortName?: string;
//   logoUrl?: string;
//   players?: IUser[];
// }

// export interface IBaseMatch extends Document {
//   sport: string;                     // "Football" | "Volleyball" | ...
//   format?: string;                   // "Team", "Doubles", "Singles","Two Players - mainly for volleyball" etc. (from frontend selectedFormat)
//   tournament?: boolean;
//   startAt?: Date;
//   durationMinutes?: number;          // matchDuration from UI (mins)
//   location?: string;
//   venueId?: Types.ObjectId;
//   status: MatchStatus;
//   teams: [ITeamRef, ITeamRef];      // always two-side structure (home/away or team1/team2)
//   // referee?: string;
//   scoringUpdatedBy?: IUser[];
//   // umpire?: string;
//   createdBy?: Types.ObjectId;
//   rules?: Record<string, any>;       // sport-specific rules/settings from MatchRulesScreen
//   feed?: Array<{                     // match feed / event log (maps to feeds in UI)
//     time?: string;                   // "12'" or ISO-time or mm:ss
//     type: string;                    // "goal", "point", "sub", "timeout", ...
//     description?: string;
//     teamId?: Types.ObjectId;         // which team
//     playerId?: Types.ObjectId;       // which player
//     meta?: Record<string, any>;      // extra contextual data (assist, cardType, minute etc)
//     createdAt?: Date;
//   }>;
//   winner?: Types.ObjectId | null;    // reference to winning team (team._id) or null
//   meta?: Record<string, any>;
//   createdAt?: Date;
//   updatedAt?: Date;
// }



// export const TeamRefSchema = new Schema<ITeamRef>({
//   _id: { type: Schema.Types.ObjectId, required: false },
//   name: { type: String, required: true },
//   shortName: { type: String },
//   logoUrl: { type: String },
//   players: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
 
// }, { _id: false });

// export const BaseMatchSchema = new Schema<IBaseMatch>({
//   sport: { type: String, required: true },
//   format: { type: String },
//   tournament: { type: Boolean, default: false },

//   startAt: { type: Date },
//   durationMinutes: { type: Number },
//   location: { type: String },
//   venueId: { type: Schema.Types.ObjectId },
//   status: { type: String, default: "scheduled" },
//   teams: { type: [TeamRefSchema], required: true, validate: [(v: any[]) => v.length === 2, "Teams must be length 2"] },
//   // referee: { type: String },
//   // umpire: { type: String },
//   scoringUpdatedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
//   createdBy: { type: Schema.Types.ObjectId },
//   rules: { type: Schema.Types.Mixed, default: {} },
//   feed: { type: [{ time: String, type: String, description: String, teamId: Schema.Types.ObjectId, playerId: Schema.Types.ObjectId, meta: Schema.Types.Mixed, createdAt: { type: Date, default: Date.now } }], default: [] },
//   winner: { type: Schema.Types.ObjectId, default: null },
//   meta: { type: Schema.Types.Mixed, default: {} }
// }, { timestamps: true });

// export default mongoose.models.BaseMatch || mongoose.model<IBaseMatch>("BaseMatch", BaseMatchSchema);



// // models/BadmintonMatch.ts
// import mongoose, { Schema, Document, Types } from "mongoose";
// import { BaseMatchSchema } from "./BaseMatch";

// export type BadmintonEventType = 'Smash' | 'Drop' | 'Net' | 'Out' | 'ServiceFault' | 'BodyTouch';

// export interface IRallyEvent {
//   playerId: Types.ObjectId;
//   eventType: BadmintonEventType;
//   pointTo?: number; // which team gets the point (1 or 2)
//   time?: string;
// }

// export interface IGame {
//   gameNumber: number;
//   team1Points: number;
//   team2Points: number;
//   winnerTeamId?: Types.ObjectId | null;
//   rallyLog?: IRallyEvent[];
// }

// export interface IBadmintonMatch extends Document {
//   games: IGame[];
//   currentGame: number;
//   toss?: {
//     tossWinnerTeamId: Types.ObjectId; 
//     serveFirstTeamId: Types.ObjectId;
//     sideOfServe: 'left' | 'right';
//   }
//   rules?: {
//     matchType?: string; // "friendly" | "friendly cup" | "Exhibition" | "practice"
//     numberOfSets?: number;  // 3
//     pointerPerSet?: number;  // 21
//   } & Record<string, any>;
// }

// const RallyEventSchema = new Schema<IRallyEvent>({
//   playerId: { type: Schema.Types.ObjectId, required: true },
//   eventType: { 
//     type: String, 
//     enum: ['Smash', 'Drop', 'Net', 'Out', 'ServiceFault', 'BodyTouch'], 
//     required: true 
//   },
//   pointTo: { type: Number },
//   time: { type: String }
// }, { _id: false });

// const GameSchema = new Schema<IGame>({
//   gameNumber: { type: Number, required: true },
//   team1Points: { type: Number, default: 0 },
//   team2Points: { type: Number, default: 0 },
//   winnerTeamId: { type: Schema.Types.ObjectId, default: null },
//   rallyLog: { type: [RallyEventSchema], default: [] }
// }, { _id: false });

// const BadmintonMatchSchema = new Schema<IBadmintonMatch>({
//   ...BaseMatchSchema.obj,

//   games: { type: [GameSchema], default: [] },
//   currentGame: { type: Number, default: 1 },
//   rules: { type: Schema.Types.Mixed, default: { pointsToWin: 21, numberOfSets: 3, pointerPerSet: 21 } }
// }, { timestamps: true });

// export default mongoose.models.BadmintonMatch || mongoose.model("BadmintonMatch", BadmintonMatchSchema);

// import mongoose, { Schema, Document, Types } from "mongoose";
// import { BaseMatchSchema } from "./BaseMatch";

// // Types of scoring or foul events
// export type BasketballEventType =
//   | "1_pointer"
//   | "2_pointer"
//   | "3_pointer"
//   | "free_throw"
//   | "free_throw_missed"
//   | "shooting_foul"
//   | "technical_foul"
//   | "flagrant_foul"
//   | "player_disqualified"
//   | "player_substitute"
//   | "drinks_break"
//   | "resume";

// export interface IScoreEvent {
//   quarter: number;
//   time?: string;              // mm:ss or clock time
//   teamId: Types.ObjectId;
//   playerId?: Types.ObjectId;
//   type: BasketballEventType;
//   points?: 0 | 1 | 2 | 3;     // Only for scoring events
 
// }

// export interface IBasketballMatch extends Document {
//   // Base fields from BaseMatchSchema
//   quarters: number;           // Default 4
//   quarterDurationMins: number;
//   currentQuarter: number;
//   scoreByQuarter: Array<{ team1: number; team2: number }>;
//   totalScore: { team1: number; team2: number };
//   fouls: Array<{ playerId: Types.ObjectId; teamId: Types.ObjectId; quarter: number; type: string }>;
//   timeouts: Array<{ teamId: Types.ObjectId; quarter: number; time: string }>;
//   scoreEvents: IScoreEvent[];
//   rules?: {
//     matchType?: string; // "friendly" | "tournament" | etc.
//     numberOfQuarters?: number;
//     eachQuarterDuration?: number;
//     secondRule24?: boolean;
//     secondRule8?: boolean;
//     secondRule5?: boolean;
//     secondRule3?: boolean;
//     pointerThrow3?: boolean;
//     courtSize?: string; // "half" | "full"
//   };
// }

// const ScoreEventSchema = new Schema<IScoreEvent>(
//   {
//     quarter: { type: Number, required: true },
//     time: { type: String },
//     teamId: { type: Schema.Types.ObjectId, required: true },
//     playerId: { type: Schema.Types.ObjectId },
//     type: {
//       type: String,
//       enum: [
//         "1_pointer",
//         "2_pointer",
//         "3_pointer",
//         "free_throw",
//         "free_throw_missed",
//         "shooting_foul",
//         "technical_foul",
//         "flagrant_foul",
//         "player_disqualified",
//         "player_substitute",
//         "drinks_break",
//         "resume"
//       ],
//       required: true,
//     },
//     points: { type: Number, enum: [0, 1, 2, 3], default: 0 },
    
//   },
//   { _id: false }
// );

// const BasketballMatchSchema = new Schema<IBasketballMatch>(
//   {
//     ...BaseMatchSchema.obj,

//     quarters: { type: Number, default: 4 },
//     quarterDurationMins: { type: Number, default: 10 },
//     currentQuarter: { type: Number, default: 1 },

//     scoreByQuarter: { type: [{ team1: Number, team2: Number }], default: [] },
//     totalScore: { team1: { type: Number, default: 0 }, team2: { type: Number, default: 0 } },

//     fouls: {
//       type: [
//         {
//           playerId: Schema.Types.ObjectId,
//           teamId: Schema.Types.ObjectId,
//           quarter: Number,
//           type: String, // e.g., "technical", "flagrant", etc.
//         },
//       ],
//       default: [],
//     },

//     timeouts: {
//       type: [{ teamId: Schema.Types.ObjectId, quarter: Number, time: String }],
//       default: [],
//     },

//     scoreEvents: { type: [ScoreEventSchema], default: [] },
//     rules: { type: Schema.Types.Mixed, default: {} },
//   },
//   { timestamps: true }
// );

// export default mongoose.models.BasketballMatch ||
//   mongoose.model("BasketballMatch", BasketballMatchSchema);
    


// // models/FootballMatch.ts
// import mongoose, { Schema, Types } from "mongoose";
// import { BaseMatchSchema, IBaseMatch } from "./BaseMatch";

// export type FootballEventType =
//   | "goal"
//   | "own_goal"
//   | "goal_saved"
//   | "penalty_scored"
//   | "penalty_missed"
//   | "yellow_card"
//   | "red_card"
//   | "corner_kick"
//   | "foul_free_kick"
//   | "save"
//   | "substitution"
//   | "drinks_break"
//   | "resume";

// export interface IGoalEvent {
//   minute: number;
//   type: "goal" | "own_goal" | "penalty_scored" | "penalty_missed" | "goal_saved";
//   teamId: Types.ObjectId;
//   scorerId?: Types.ObjectId;
//   assistId?: Types.ObjectId;
//   description?: string;
// }

// export interface IFootballMatch extends IBaseMatch {
//   halfDurationMinutes?: number;
//   currentHalf?: 1 | 2 | 3 | 4;
//   score: { team1: number; team2: number };

//   goals: IGoalEvent[];
//   yellowCards: Array<{ minute: number; playerId: Types.ObjectId; teamId: Types.ObjectId; reason?: string }>;
//   redCards: Array<{ minute: number; playerId: Types.ObjectId; teamId: Types.ObjectId; reason?: string }>;
//   substitutions: Array<{ minute: number; outPlayerId: Types.ObjectId; inPlayerId: Types.ObjectId; teamId: Types.ObjectId }>;

//   extraTime?: { enabled: boolean; score?: { team1: number; team2: number } };
//   penalties?: Array<{ playerId?: Types.ObjectId; converted: boolean; order: number; teamId: Types.ObjectId }>;

//   toss?: {
//     tossWinnerTeamId: Types.ObjectId;
//     kickOffFirstTeamId: Types.ObjectId;
//     sideOfServe: "left" | "right";
//   };

//   rules?: {
//     matchType?: string;
//     pitchType?: string;
//     matchTotalDuration?: number;
//     extraTime?: boolean;
//     penaltyShootout?: boolean;
//     playerSubstitute?: boolean;
//     offsideRule?: boolean;
//     cardsEnforcement?: boolean;
//     freeKicks?: boolean;
//     cornerKicks?: boolean;
//     goalSize?: string;
//     matchBreakDuration?: number;
//   };
// }

// const GoalSchema = new Schema<IGoalEvent>(
//   {
//     minute: { type: Number, required: true },
//     type: {
//       type: String,
//       enum: ["goal", "own_goal", "penalty_scored", "penalty_missed", "goal_saved"],
//       default: "goal",
//     },
//     teamId: { type: Schema.Types.ObjectId, required: true },
//     scorerId: { type: Schema.Types.ObjectId },
//     assistId: { type: Schema.Types.ObjectId },
//     description: { type: String },
//   },
//   { _id: false }
// );

// const FootballMatchSchema = new Schema<IFootballMatch>(
//   {
//     halfDurationMinutes: { type: Number, default: 45 },
//     currentHalf: { type: Number, default: 1 },
//     score: {
//       team1: { type: Number, default: 0 },
//       team2: { type: Number, default: 0 },
//     },
//     goals: { type: [GoalSchema], default: [] },
//     yellowCards: {
//       type: [{ minute: Number, playerId: Schema.Types.ObjectId, teamId: Schema.Types.ObjectId, reason: String }],
//       default: [],
//     },
//     redCards: {
//       type: [{ minute: Number, playerId: Schema.Types.ObjectId, teamId: Schema.Types.ObjectId, reason: String }],
//       default: [],
//     },
//     substitutions: {
//       type: [{ minute: Number, outPlayerId: Schema.Types.ObjectId, inPlayerId: Schema.Types.ObjectId, teamId: Schema.Types.ObjectId }],
//       default: [],
//     },
//     extraTime: { type: { enabled: Boolean, score: { team1: Number, team2: Number } }, default: null },
//     penalties: {
//       type: [{ playerId: Schema.Types.ObjectId, converted: Boolean, order: Number, teamId: Schema.Types.ObjectId }],
//       default: [],
//     },
//     toss: {
//       tossWinnerTeamId: Schema.Types.ObjectId,
//       kickOffFirstTeamId: Schema.Types.ObjectId,
//       sideOfServe: { type: String, enum: ["left", "right"] },
//     },
//     rules: { type: Schema.Types.Mixed, default: {} },
//   },
//   { timestamps: true }
// );

// FootballMatchSchema.add(BaseMatchSchema);

// export default mongoose.models.FootballMatch ||
//   mongoose.model<IFootballMatch>("FootballMatch", FootballMatchSchema);


// // models/PickleballMatch.ts
// import mongoose, { Schema, Document, Types } from "mongoose";
// import { BaseMatchSchema } from "./BaseMatch";

// export type PickleballEventType = 'Smash' | 'Drop' | 'Net' | 'Out' | 'ServiceFault' | 'BodyTouch';

// export interface IRallyEvent {
//   playerId: Types.ObjectId;
//   eventType: PickleballEventType;
//   pointTo?: number; // which team gets the point (1 or 2)
//   time?: string;
// }

// export interface IGame {
//   gameNumber: number;
//   team1Points: number;
//   team2Points: number;
//   winnerTeamId?: Types.ObjectId | null;
//   rallyLog?: IRallyEvent[];
// }

// export interface IPickleballMatch extends Document {
//   games: IGame[];
//   currentGame: number;
//   toss?: {
//     tossWinnerTeamId: Types.ObjectId; 
//     serveFirstTeamId: Types.ObjectId;
//     sideOfServe: 'left' | 'right';
//   }
//   rules?: {
//     matchType?: string; // "friendly" | "friendly cup" | "Exhibition" | "practice"
//     numberOfSets?: number;  // 3
//     pointerPerSet?: number;  // 21
//   } & Record<string, any>;
// }

// const RallyEventSchema = new Schema<IRallyEvent>({
//   playerId: { type: Schema.Types.ObjectId, required: true },
//   eventType: { 
//     type: String, 
//     enum: ['Smash', 'Drop', 'Net', 'Out', 'ServiceFault', 'BodyTouch'], 
//     required: true 
//   },
//   pointTo: { type: Number },
//   time: { type: String }
// }, { _id: false });

// const GameSchema = new Schema<IGame>({
//   gameNumber: { type: Number, required: true },
//   team1Points: { type: Number, default: 0 },
//   team2Points: { type: Number, default: 0 },
//   winnerTeamId: { type: Schema.Types.ObjectId, default: null },
//   rallyLog: { type: [RallyEventSchema], default: [] }
// }, { _id: false });

// const PickleballMatchSchema = new Schema<IPickleballMatch>({
//   ...BaseMatchSchema.obj,

//   games: { type: [GameSchema], default: [] },
//   currentGame: { type: Number, default: 1 },
//   rules: { type: Schema.Types.Mixed, default: { pointsToWin: 21, numberOfSets: 3, pointerPerSet: 21 } }
// }, { timestamps: true });

// export default mongoose.models.PickleballMatch || mongoose.model("PickleballMatch", PickleballMatchSchema);


// // models/TennisMatch.ts
// import mongoose, { Schema, Document, Types } from "mongoose";
// import { BaseMatchSchema } from "./BaseMatch";

// export type TennisEventType =
//   | "Smash"
//   | "Ace"
//   | "Drop"
//   | "Net"
//   | "Out"
//   | "ServiceFault"
//   | "BodyTouch";

// export interface IRallyEvent {
//   playerId: Types.ObjectId;
//   eventType: TennisEventType;
//   pointTo?: number; // which team gets the point (1 or 2)
//   time?: string;
// }

// export interface IGame {
//   gameNumber: number;
//   team1Points: number;
//   team2Points: number;
//   winnerTeamId?: Types.ObjectId | null;
//   rallyLog?: IRallyEvent[];
// }

// export interface ITennisMatch extends Document {
//   games: IGame[];
//   currentGame: number;
//   toss?: {
//     tossWinnerTeamId: Types.ObjectId;
//     serveFirstTeamId: Types.ObjectId;
//     sideOfServe: "left" | "right";
//   };
//   rules?: {
//     matchType?: string; // "friendly" | "friendly cup" | "Exhibition" | "practice"
//     surfaceType?: string; // "Synthetic" | "clay" | "grass" | "hard"
//     numberOfSets?: number; // 3
//     numberOfMatchesToDecideWinner?: number; // 1 or 2
//     advantageRule?: boolean;
//     finalSetTieBreak?: boolean;
//     matchTieBreak?: boolean;
//     superTieBreakPoints?: number; // 7 or 10
//   } & Record<string, any>;
// }

// // --------------------- SCHEMAS --------------------- //

// const RallyEventSchema = new Schema<IRallyEvent>(
//   {
//     playerId: { type: Schema.Types.ObjectId, required: true },
//     eventType: {
//       type: String,
//       enum: ["Smash", "Ace", "Drop", "Net", "Out", "ServiceFault", "BodyTouch"],
//       required: true,
//     },
//     pointTo: { type: Number },
//     time: { type: String },
//   },
//   { _id: false }
// );

// const GameSchema = new Schema<IGame>(
//   {
//     gameNumber: { type: Number, required: true },
//     team1Points: { type: Number, default: 0 },
//     team2Points: { type: Number, default: 0 },
//     winnerTeamId: { type: Schema.Types.ObjectId, default: null },
//     rallyLog: { type: [RallyEventSchema], default: [] },
//   },
//   { _id: false }
// );

// const TossSchema = new Schema(
//   {
//     tossWinnerTeamId: { type: Schema.Types.ObjectId, required: true },
//     serveFirstTeamId: { type: Schema.Types.ObjectId, required: true },
//     sideOfServe: { type: String, enum: ["left", "right"], required: true },
//   },
//   { _id: false }
// );

// const RulesSchema = new Schema(
//   {
//     matchType: {
//       type: String,
//       enum: ["friendly", "friendly cup", "exhibition", "practice"],
//     },
//     surfaceType: {
//       type: String,
//       enum: ["synthetic", "clay", "grass", "hard"],
//     },
//     numberOfSets: { type: Number, default: 3 },
//     numberOfMatchesToDecideWinner: { type: Number, default: 1 },
//     advantageRule: { type: Boolean, default: true },
//     finalSetTieBreak: { type: Boolean, default: true },
//     matchTieBreak: { type: Boolean, default: true },
//     superTieBreakPoints: { type: Number, default: 10 },
//   },
//   { _id: false }
// );

// // --------------------- MAIN SCHEMA --------------------- //

// const TennisMatchSchema = new Schema<ITennisMatch>(
//   {
//     ...BaseMatchSchema.obj,

//     games: { type: [GameSchema], default: [] },
//     currentGame: { type: Number, default: 1 },
//     toss: { type: TossSchema, default: null },
//     rules: { type: RulesSchema, default: () => ({}) },
//   },
//   { timestamps: true }
// );

// export default
//   mongoose.models.TennisMatch ||
//   mongoose.model<ITennisMatch>("TennisMatch", TennisMatchSchema);


// // models/VolleyballMatch.ts
// import mongoose, { Schema, Document, Types } from "mongoose";
// import { BaseMatchSchema } from "./BaseMatch";

// export type VolleyballEventType = 'Smash' | 'Drop' | 'Net' | 'Out' | 'ServiceFault' | 'BodyTouch';

// export interface IRallyEvent {
//   playerId: Types.ObjectId;
//   eventType: VolleyballEventType;
//   pointTo?: number; // which team gets the point (1 or 2)
//   time?: string;
// }

// export interface IGame {
//   gameNumber: number;
//   team1Points: number;
//   team2Points: number;
//   winnerTeamId?: Types.ObjectId | null;
//   rallyLog?: IRallyEvent[];
// }

// export interface IVolleyballMatch extends Document {
//   games: IGame[];
//   currentGame: number;
//   toss?: {
//     tossWinnerTeamId: Types.ObjectId; 
//     serveFirstTeamId: Types.ObjectId;
//     sideOfServe: 'left' | 'right';
//   }
//   rules?: {
//     matchType?: string; // "friendly" | "friendly cup" | "Exhibition" | "practice"
//     numberOfSets?: number;  // 3
//     pointerPerSet?: number;  // 21
//     playerSubstitutionsAllowed?: boolean;
//     liberoPlayerAllowed?: boolean;
//     cardsEnforced?: boolean;
//     empulsion?: boolean;
//     disqualifications?: boolean;
//   } & Record<string, any>;
// }

// const RallyEventSchema = new Schema<IRallyEvent>({
//   playerId: { type: Schema.Types.ObjectId, required: true },
//   eventType: { 
//     type: String, 
//     enum: ['Smash', 'Drop', 'Net', 'Out', 'ServiceFault', 'BodyTouch'], 
//     required: true 
//   },
//   pointTo: { type: Number },
//   time: { type: String }
// }, { _id: false });

// const GameSchema = new Schema<IGame>({
//   gameNumber: { type: Number, required: true },
//   team1Points: { type: Number, default: 0 },
//   team2Points: { type: Number, default: 0 },
//   winnerTeamId: { type: Schema.Types.ObjectId, default: null },
//   rallyLog: { type: [RallyEventSchema], default: [] }
// }, { _id: false });

// const VolleyballMatchSchema = new Schema<IVolleyballMatch>({
//   ...BaseMatchSchema.obj,

//   games: { type: [GameSchema], default: [] },
//   currentGame: { type: Number, default: 1 },
//   rules: { type: Schema.Types.Mixed, default: { pointsToWin: 21, numberOfSets: 3, pointerPerSet: 21, playerSubstitutionsAllowed: true, liberoPlayerAllowed: true, cardsEnforced: true, empulsion: true, disqualifications: true } }
// }, { timestamps: true });

// export default mongoose.models.VolleyballMatch || mongoose.model("VolleyballMatch", VolleyballMatchSchema);



