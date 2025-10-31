// Import all sport models
import { Request, Response } from "express";
import mongoose from "mongoose";

// 🏈 FOOTBALL leaderboard
export async function getFootballLeaderboard(Model: mongoose.Model<any>) {
  const matches = await Model.find({ status: "completed" }).lean();

  const playerStats: Record<string, any> = {};

  matches.forEach(match => {
    const matchId = String((match as any)._id);
    match.goals.forEach((goal: any) => {
      if (!goal.scorerId) return;
      const id = goal.scorerId.toString();
      if (!playerStats[id]) playerStats[id] = { goals: 0, matches: new Set(), teamId: goal.teamId };
      playerStats[id].goals += 1;
      playerStats[id].matches.add(matchId);
    });
  });

  return Object.entries(playerStats)
    .map(([playerId, data]: any) => ({
      playerId,
      teamId: data.teamId,
      matchesPlayed: data.matches.size,
      goals: data.goals,
    }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 20);
}

// 🏸 RACKET SPORTS leaderboard (Badminton, Pickleball, Tennis, Volleyball)
export async function getRacketSportLeaderboard(Model: mongoose.Model<any>) {
  const matches = await Model.find({ status: "completed" }).lean();
  const playerStats: Record<string, any> = {};

  matches.forEach(match => {
    const matchId = String((match as any)._id);
    match.games?.forEach((game: any) => {
      game.rallyLog?.forEach((rally: any) => {
        if (!rally.playerId) return;
        const id = rally.playerId.toString();
        if (!playerStats[id]) playerStats[id] = { points: 0, matches: new Set(), teamId: rally.pointTo };
        if (rally.pointTo) playerStats[id].points += 1;
        playerStats[id].matches.add(matchId);
      });
    });
  });

  return Object.entries(playerStats)
    .map(([playerId, data]: any) => ({
      playerId,
      teamId: data.teamId,
      matchesPlayed: data.matches.size,
      points: data.points,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 20);
}

// 🏀 BASKETBALL leaderboard
export async function getBasketballLeaderboard(Model: mongoose.Model<any>) {
  const matches = await Model.find({ status: "completed" }).lean();
  const playerStats: Record<string, any> = {};

  matches.forEach(match => {
    const matchId = String((match as any)._id);
    match.scoreEvents?.forEach((event: any) => {
      if (!event.playerId || !event.points) return;
      const id = event.playerId.toString();
      if (!playerStats[id]) playerStats[id] = { points: 0, matches: new Set(), teamId: event.teamId };
      playerStats[id].points += event.points;
      playerStats[id].matches.add(matchId);
    });
  });

  return Object.entries(playerStats)
    .map(([playerId, data]: any) => ({
      playerId,
      teamId: data.teamId,
      matchesPlayed: data.matches.size,
      points: data.points,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 20);
}
