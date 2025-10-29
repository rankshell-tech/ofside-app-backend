// src/utils/matchModelResolver.ts
import BadmintonMatch from "../models/BadmintonMatch";
import BasketballMatch from "../models/BasketballMatch";
import FootballMatch from "../models/FootballMatch";
import VolleyballMatch from "../models/VolleyballMatch";
import TennisMatch from "../models/TennisMatch";
import PickleballMatch from "../models/PickleballMatch";

const models: Record<string, any> = {
    badminton: BadmintonMatch,
    basketball: BasketballMatch,
    football: FootballMatch,
    volleyball: VolleyballMatch,
    tennis: TennisMatch,
    pickleball: PickleballMatch,
};

export function getMatchModel(sport: string) {
    const model = models[sport.toLowerCase()];
    if (!model) throw new Error(`Unknown sport type: ${sport}`);
    return model;
}
