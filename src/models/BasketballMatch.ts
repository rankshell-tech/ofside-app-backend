import mongoose, { Schema, Document, Types } from "mongoose";
import { BaseMatchSchema } from "./BaseMatch";

// Types of scoring or foul events
export type BasketballEventType =
  | "1_pointer"
  | "2_pointer"
  | "3_pointer"
  | "free_throw"
  | "free_throw_missed"
  | "shooting_foul"
  | "technical_foul"
  | "flagrant_foul"
  | "player_disqualified"
  | "player_substitute"
  | "drinks_break"
  | "resume";

export interface IScoreEvent {
  quarter: number;
  time?: string;              // mm:ss or clock time
  teamId: Types.ObjectId;
  playerId?: Types.ObjectId;
  type: BasketballEventType;
  points?: 0 | 1 | 2 | 3;     // Only for scoring events
 
}

export interface IBasketballMatch extends Document {
  // Base fields from BaseMatchSchema
  quarters: number;           // Default 4
  quarterDurationMins: number;
  currentQuarter: number;
  scoreByQuarter: Array<{ team1: number; team2: number }>;
  totalScore: { team1: number; team2: number };
  fouls: Array<{ playerId: Types.ObjectId; teamId: Types.ObjectId; quarter: number; type: string }>;
  timeouts: Array<{ teamId: Types.ObjectId; quarter: number; time: string }>;
  scoreEvents: IScoreEvent[];
  rules?: {
    matchType?: string; // "friendly" | "tournament" | etc.
    numberOfQuarters?: number;
    eachQuarterDuration?: number;
    secondRule24?: boolean;
    secondRule8?: boolean;
    secondRule5?: boolean;
    secondRule3?: boolean;
    pointerThrow3?: boolean;
    courtSize?: string; // "half" | "full"
  };
}

const ScoreEventSchema = new Schema<IScoreEvent>(
  {
    quarter: { type: Number, required: true },
    time: { type: String },
    teamId: { type: Schema.Types.ObjectId, required: true },
    playerId: { type: Schema.Types.ObjectId },
    type: {
      type: String,
      enum: [
        "1_pointer",
        "2_pointer",
        "3_pointer",
        "free_throw",
        "free_throw_missed",
        "shooting_foul",
        "technical_foul",
        "flagrant_foul",
        "player_disqualified",
        "player_substitute",
        "drinks_break",
        "resume"
      ],
      required: true,
    },
    points: { type: Number, enum: [0, 1, 2, 3], default: 0 },
    
  },
  { _id: false }
);

const BasketballMatchSchema = new Schema<IBasketballMatch>(
  {
    ...BaseMatchSchema.obj,

    quarters: { type: Number, default: 4 },
    quarterDurationMins: { type: Number, default: 10 },
    currentQuarter: { type: Number, default: 1 },

    scoreByQuarter: { type: [{ team1: Number, team2: Number }], default: [] },
    totalScore: { team1: { type: Number, default: 0 }, team2: { type: Number, default: 0 } },

    fouls: {
      type: [
        {
          playerId: Schema.Types.ObjectId,
          teamId: Schema.Types.ObjectId,
          quarter: Number,
          type: String, // e.g., "technical", "flagrant", etc.
        },
      ],
      default: [],
    },

    timeouts: {
      type: [{ teamId: Schema.Types.ObjectId, quarter: Number, time: String }],
      default: [],
    },

    scoreEvents: { type: [ScoreEventSchema], default: [] },
    rules: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.BasketballMatch ||
  mongoose.model("BasketballMatch", BasketballMatchSchema);
    