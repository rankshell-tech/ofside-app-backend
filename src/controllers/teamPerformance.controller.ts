import { Request, Response } from "express";
import mongoose from "mongoose";
import { getMatchModel } from "../utils/matchModelResolver";

export const getTeamPerformance = async (req: Request, res: Response) => {
  try {
    const { sport, teamId, startDate, endDate } = req.query;

    if (!sport || !teamId) {
      return res.status(400).json({ message: "Sport and teamId are required" });
    }

    const Model = getMatchModel(sport as string);
    if (!Model) {
      return res.status(400).json({ message: "Invalid sport type" });
    }

    // Build filter query - FIXED: Use teams._id instead of teams.teamId
    const filter: any = {
      sport: sport as string,
      "teams._id": new mongoose.Types.ObjectId(teamId as string),
    };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const matches = await Model.find(filter).lean();

    if (!matches.length) {
      return res.status(200).json({ 
        success: true, 
        message: "No matches found", 
        data: getEmptyStats(sport as string) 
      });
    }

    // Calculate sport-specific statistics
    const stats = await calculateTeamStats(matches, teamId as string, sport as string);
    
    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ------------------ SPORT-SPECIFIC CALCULATIONS ------------------

const calculateTeamStats = async (matches: any[], teamId: string, sport: string) => {
  let matchesWon = 0;
  let matchesLost = 0;
  let matchesDrawn = 0;
  let totalGoals = 0;
  let totalAssists = 0;
  let totalPoints = 0;
  let fouls = 0;
  let minsPlayed = 0;
  
  // Sport-specific counters
  const sportStats: any = {
    // Football
    shotsOnGoal: 0,
    freeKicks: 0,
    cornerKicks: 0,
    
    // Basketball
    rebounds: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    
    // Racket Sports
    aces: 0,
    smashes: 0,
    drops: 0,
    nets: 0,
    serviceFaults: 0,
    unforcedErrors: 0,
    
    // Volleyball
    spikes: 0,
    // blocks: 0,
    digs: 0,
    serves: 0,
  };

  const playerPerformance: Record<string, any> = {};

  for (const match of matches) {
    const teamIndex = match.teams.findIndex((t: any) => 
      t._id?.toString() === teamId
    );
    
    if (teamIndex === -1) continue;

    const isTeam1 = teamIndex === 0;
    minsPlayed += match.durationMinutes || 0;

    // Match result calculation - FIXED
    if (match.winner) {
      if (match.winner.toString() === teamId) {
        matchesWon++;
      } else {
        matchesLost++;
      }
    } else {
      matchesDrawn++;
    }

    // Sport-specific statistics
    switch (sport.toLowerCase()) {
      case "football":
        await calculateFootballStats(match, teamId, sportStats, playerPerformance);
        totalGoals += match.goals?.filter((g: any) => g.teamId?.toString() === teamId).length || 0;
        totalAssists += match.goals?.filter((g: any) => g.assistId && g.teamId?.toString() === teamId).length || 0;
        break;

      case "basketball":
        await calculateBasketballStats(match, teamId, sportStats, playerPerformance);
        totalPoints += isTeam1 ? (match.totalScore?.team1 || 0) : (match.totalScore?.team2 || 0);
        break;

      case "badminton":
      case "tennis":
      case "pickleball":
        await calculateRacketSportsStats(match, teamId, sportStats, playerPerformance, sport);
        const teamPoints = calculateRacketSportsPoints(match, teamIndex);
        totalPoints += teamPoints;
        break;

      case "volleyball":
        await calculateVolleyballStats(match, teamId, sportStats, playerPerformance);
        const volleyballPoints = calculateVolleyballPoints(match, teamIndex);
        totalPoints += volleyballPoints;
        break;
    }

    // Common fouls calculation
    fouls += calculateFouls(match, teamId, sport);
  }

  const matchesPlayed = matches.length;
  const winRate = matchesPlayed > 0 ? ((matchesWon / matchesPlayed) * 100) : 0;
  const lossRate = matchesPlayed > 0 ? ((matchesLost / matchesPlayed) * 100) : 0;
  const drawRate = matchesPlayed > 0 ? ((matchesDrawn / matchesPlayed) * 100) : 0;

  // Top performers calculation
  const topPlayers = Object.entries(playerPerformance)
    .sort((a: any, b: any) => b[1].performanceScore - a[1].performanceScore)
    .slice(0, 3)
    .map(([playerId, data]: [string, any]) => ({
      name: data.name || `Player ${playerId.slice(-4)}`,
      points: data.performanceScore,
      goals: data.goals || 0,
      assists: data.assists || 0,
    }));

  // Trend data for last 10 matches
  const trendData = matches.slice(-10).map((match: any, idx: number) => {
    const teamIndex = match.teams.findIndex((t: any) => t._id?.toString() === teamId);
    const isTeam1 = teamIndex === 0;
    
    return {
      match: `Match ${idx + 1}`,
      goals: getMatchGoals(match, teamId, sport),
      assists: getMatchAssists(match, teamId, sport),
      points: getMatchPoints(match, teamIndex, sport),
      minsPlayed: match.durationMinutes || 0,
    };
  });

  return {
    matchesPlayed,
    matchesWon,
    matchesLost,
    matchesDrawn,
    totalGoals,
    totalAssists,
    totalPoints,
    fouls,
    minsPlayed,
    winRate: Number(winRate.toFixed(1)),
    lossRate: Number(lossRate.toFixed(1)),
    drawRate: Number(drawRate.toFixed(1)),
    topPlayers,
    trendData,
    sportSpecific: sportStats,
  };
};

// ------------------ SPORT-SPECIFIC HELPER FUNCTIONS ------------------

const calculateFootballStats = async (match: any, teamId: string, sportStats: any, playerPerformance: any) => {
  // Goals and assists
  match.goals?.forEach((goal: any) => {
    if (goal.teamId?.toString() === teamId) {
      if (goal.scorerId) {
        updatePlayerPerformance(playerPerformance, goal.scorerId, 'goals');
      }
      if (goal.assistId) {
        updatePlayerPerformance(playerPerformance, goal.assistId, 'assists');
      }
    }
  });

  // Feed events
  match.feed?.forEach((event: any) => {
    if (event.teamId?.toString() === teamId) {
      if (event.type === "goal") sportStats.shotsOnGoal++;
      if (event.type === "foul_free_kick") sportStats.freeKicks++;
      if (event.type === "corner_kick") sportStats.cornerKicks++;
      
      if (event.playerId) {
        updatePlayerPerformance(playerPerformance, event.playerId, 'contributions');
      }
    }
  });
};

const calculateBasketballStats = async (match: any, teamId: string, sportStats: any, playerPerformance: any) => {
  match.scoreEvents?.forEach((event: any) => {
    if (event.teamId?.toString() === teamId && event.playerId) {
      updatePlayerPerformance(playerPerformance, event.playerId, 'points', event.points || 0);
    }
  });

  // Count team fouls
  sportStats.fouls += match.fouls?.filter((f: any) => f.teamId?.toString() === teamId).length || 0;
};

const calculateRacketSportsStats = async (match: any, teamId: string, sportStats: any, playerPerformance: any, sport: string) => {
  match.games?.forEach((game: any) => {
    game.rallyLog?.forEach((rally: any) => {
      if (rally.playerId) {
        const playerTeam = match.teams.find((t: any) => 
          t.players?.some((p: any) => p.toString() === rally.playerId?.toString())
        );
        
        if (playerTeam?._id?.toString() === teamId) {
          // Count sport-specific events
          if (rally.eventType === "Ace") sportStats.aces++;
          if (rally.eventType === "Smash") sportStats.smashes++;
          if (rally.eventType === "Drop") sportStats.drops++;
          if (rally.eventType === "Net") sportStats.nets++;
          if (rally.eventType === "ServiceFault") sportStats.serviceFaults++;
          if (["Out", "ServiceFault"].includes(rally.eventType)) sportStats.unforcedErrors++;
          
          updatePlayerPerformance(playerPerformance, rally.playerId, rally.eventType.toLowerCase());
        }
      }
    });
  });
};

const calculateVolleyballStats = async (match: any, teamId: string, sportStats: any, playerPerformance: any) => {
  match.games?.forEach((game: any) => {
    game.rallyLog?.forEach((rally: any) => {
      if (rally.playerId) {
        const playerTeam = match.teams.find((t: any) => 
          t.players?.some((p: any) => p.toString() === rally.playerId?.toString())
        );
        
        if (playerTeam?._id?.toString() === teamId) {
          // Map rally events to volleyball terms
          if (rally.eventType === "Smash") sportStats.spikes++;
          if (rally.eventType === "Net") sportStats.blocks++;
          if (rally.eventType === "Drop") sportStats.digs++;
          if (rally.eventType === "ServiceFault") sportStats.serviceFaults++;
          
          updatePlayerPerformance(playerPerformance, rally.playerId, rally.eventType.toLowerCase());
        }
      }
    });
  });
};

// ------------------ UTILITY FUNCTIONS ------------------

const calculateRacketSportsPoints = (match: any, teamIndex: number): number => {
  let totalPoints = 0;
  match.games?.forEach((game: any) => {
    totalPoints += teamIndex === 0 ? game.team1Points : game.team2Points;
  });
  return totalPoints;
};

const calculateVolleyballPoints = (match: any, teamIndex: number): number => {
  let totalPoints = 0;
  match.games?.forEach((game: any) => {
    totalPoints += teamIndex === 0 ? game.team1Points : game.team2Points;
  });
  return totalPoints;
};

const calculateFouls = (match: any, teamId: string, sport: string): number => {
  switch (sport.toLowerCase()) {
    case "football":
      return match.yellowCards?.filter((c: any) => c.teamId?.toString() === teamId).length 
           + match.redCards?.filter((c: any) => c.teamId?.toString() === teamId).length || 0;
    
    case "basketball":
      return match.fouls?.filter((f: any) => f.teamId?.toString() === teamId).length || 0;
    
    default:
      return 0;
  }
};

const updatePlayerPerformance = (playerPerformance: any, playerId: string, statType: string, value: number = 1) => {
  if (!playerPerformance[playerId]) {
    playerPerformance[playerId] = {
      performanceScore: 0,
      goals: 0,
      assists: 0,
      contributions: 0,
    };
  }

  const player = playerPerformance[playerId];
  
  switch (statType) {
    case 'goals':
      player.goals += value;
      player.performanceScore += value * 3; // Goals worth more
      break;
    case 'assists':
      player.assists += value;
      player.performanceScore += value * 2; // Assists worth less than goals
      break;
    case 'points':
      player.performanceScore += value;
      break;
    default:
      player.contributions += value;
      player.performanceScore += value * 0.5; // Other contributions
  }
};

const getMatchGoals = (match: any, teamId: string, sport: string): number => {
  if (sport.toLowerCase() === "football") {
    return match.goals?.filter((g: any) => g.teamId?.toString() === teamId).length || 0;
  }
  return 0;
};

const getMatchAssists = (match: any, teamId: string, sport: string): number => {
  if (sport.toLowerCase() === "football") {
    return match.goals?.filter((g: any) => g.assistId && g.teamId?.toString() === teamId).length || 0;
  }
  return 0;
};

const getMatchPoints = (match: any, teamIndex: number, sport: string): number => {
  if (teamIndex === -1) return 0;
  
  switch (sport.toLowerCase()) {
    case "basketball":
      return teamIndex === 0 ? (match.totalScore?.team1 || 0) : (match.totalScore?.team2 || 0);
    
    case "badminton":
    case "tennis":
    case "pickleball":
    case "volleyball":
      let points = 0;
      match.games?.forEach((game: any) => {
        points += teamIndex === 0 ? game.team1Points : game.team2Points;
      });
      return points;
    
    default:
      return 0;
  }
};

const getEmptyStats = (sport: string) => ({
  matchesPlayed: 0,
  matchesWon: 0,
  matchesLost: 0,
  matchesDrawn: 0,
  totalGoals: 0,
  totalAssists: 0,
  totalPoints: 0,
  fouls: 0,
  minsPlayed: 0,
  winRate: 0,
  lossRate: 0,
  drawRate: 0,
  topPlayers: [],
  trendData: [],
  sportSpecific: {},
});

// ------------------ ADDITIONAL CONTROLLERS FOR UI COMPONENTS ------------------

export const getTeamTopPerformances = async (req: Request, res: Response) => {
  try {
    const { sport, teamId, limit = 3 } = req.query;
    
    const Model = getMatchModel(sport as string);
    const matches = await Model.find({
      "teams._id": new mongoose.Types.ObjectId(teamId as string),
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    const performances = matches.map((match: any) => {
      const teamIndex = match.teams.findIndex((t: any) => t._id?.toString() === teamId);
      const isTeam1 = teamIndex === 0;
      
      return {
        matchId: match._id,
        opponent: match.teams[teamIndex === 0 ? 1 : 0]?.name || 'Opponent',
        score: isTeam1 ? 
          `${match.totalScore?.team1 || 0}-${match.totalScore?.team2 || 0}` :
          `${match.totalScore?.team2 || 0}-${match.totalScore?.team1 || 0}`,
        performance: calculateMatchPerformance(match, teamId as string, sport as string),
        date: match.createdAt,
      };
    })
    .sort((a: { performance: number; }, b: { performance: number; }) => b.performance - a.performance)
    .slice(0, parseInt(limit as string));

    res.status(200).json({ success: true, data: performances });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const calculateMatchPerformance = (match: any, teamId: string, sport: string): number => {
  // Simple performance calculation based on win and score difference
  const teamIndex = match.teams.findIndex((t: any) => t._id?.toString() === teamId);
  const isTeam1 = teamIndex === 0;
  
  let performance = 0;
  
  // Win bonus
  if (match.winner?.toString() === teamId) {
    performance += 50;
  }
  
  // Score difference bonus
  if (match.totalScore) {
    const myScore = isTeam1 ? match.totalScore.team1 : match.totalScore.team2;
    const opponentScore = isTeam1 ? match.totalScore.team2 : match.totalScore.team1;
    performance += (myScore - opponentScore) * 5;
  }
  
  return Math.max(performance, 0);
};