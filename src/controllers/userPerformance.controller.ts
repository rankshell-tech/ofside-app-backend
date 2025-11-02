import { Request, Response } from "express";


import { getMatchModel } from "../utils/matchModelResolver";


const getDateRange = (range: string) => {
  if (range === "all") return {};
  const days = parseInt(range) || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return { $gte: startDate };
};

// ------------------ SPORT CALCULATIONS ------------------

const footballStats = async (userId: string, filters: any) => {
  const matches = await getMatchModel("football").find({
    "teams.players": userId,
    ...(filters.type !== "all" && { type: filters.type }),
    ...(filters.date && { createdAt: filters.date }),
  });

  let goals = 0,
    assists = 0,
    shotsOnGoal = 0,
    fouls = 0,
    freeKicks = 0,
    matchesPlayed = matches.length,
    manOfMatch = 0,
    wins = 0,
    losses = 0,
    draws = 0,
    minsPlayed = 0;

  for (const match of matches) {
    minsPlayed += match.durationMinutes || 0;
    goals += match.goals.filter((g: any) => g.scorerId?.toString() === userId).length;
    assists += match.goals.filter((g: any) => g.assistId?.toString() === userId).length;
    shotsOnGoal += match.feed.filter((f: any) => f.type === "shot_on_goal" && f.playerId?.toString() === userId).length;
    fouls += match.feed.filter((f: any) => f.type === "foul" && f.playerId?.toString() === userId).length;
    freeKicks += match.feed.filter((f: any) => f.type === "free_kick" && f.playerId?.toString() === userId).length;

    const teamIndex = match.teams.findIndex((t: any) => t.players.includes(userId));
    if (teamIndex !== -1) {
      const myTeamWon = match.winner?.toString() === match.teams[teamIndex]?._id?.toString();
      if (myTeamWon) wins++;
      else if (!match.winner) draws++;
      else losses++;
    }
  }

  return {
    sport: "Football",
    goals,
    assists,
    shotsOnGoal,
    matchesPlayed,
    manOfMatch,
    wins,
    losses,
    draws,
    fouls,
    freeKicks,
    minsPlayed,
  };
};

const badmintonStats = async (userId: string, filters: any) => {
  const matches = await getMatchModel("badminton").find({
    "teams.players": userId,
    ...(filters.type !== "all" && { type: filters.type }),
    ...(filters.date && { createdAt: filters.date }),
  });

  let netWinners = 0,
    smashWinners = 0,
    dropShotWinners = 0,
    unforcedErrors = 0,
    matchesPlayed = matches.length,
    wins = 0,
    losses = 0,
    minsPlayed = 0,
    consistency = 0,
    totalPointsWon = 0;

  for (const match of matches) {
    minsPlayed += match.durationMinutes || 0;
    match.games.forEach((game: any) => {
      game.rallyLog.forEach((r: any) => {
        if (r.playerId?.toString() !== userId) return;
        if (r.eventType === "Net") netWinners++;
        if (r.eventType === "Smash") smashWinners++;
        if (r.eventType === "Drop") dropShotWinners++;
        if (["Out", "ServiceFault"].includes(r.eventType)) unforcedErrors++;
        totalPointsWon += r.pointTo === userId ? 1 : 0;
      });
    });
    consistency += (netWinners + smashWinners + dropShotWinners) / (unforcedErrors + 1);
  }

  return {
    sport: "Badminton",
    netWinners,
    smashWinners,
    dropShotWinners,
    matchesPlayed,
    consistencyScore: Number((consistency / matchesPlayed).toFixed(2)),
    wins,
    losses,
    unforcedErrors,
    totalPointsWon,
    minsPlayed,
  };
};

const tennisStats = async (userId: string, filters: any) => {
  const matches = await getMatchModel("tennis").find({
    "teams.players": userId,
    ...(filters.type !== "all" && { type: filters.type }),
    ...(filters.date && { createdAt: filters.date }),
  });

  let aces = 0,
    doubleFaults = 0,
    smashes = 0,
    drops = 0,
    nets = 0,
    outs = 0,
    matchesPlayed = matches.length,
    wins = 0,
    losses = 0,
    totalPointsWon = 0,
    consistency = 0,
    minsPlayed = 0;

  for (const match of matches) {
    minsPlayed += match.durationMinutes || 0;

   match.games.forEach((game: any) => {
      game.rallyLog.forEach((r: any) => {
        if (r.playerId?.toString() !== userId) return;
        
        if (r.eventType === "Ace") aces++;
        if (r.eventType === "Smash") smashes++;
        if (r.eventType === "Drop") drops++;
        if (r.eventType === "Net") nets++;
        if (r.eventType === "Out") outs++;
        if (r.eventType === "ServiceFault") doubleFaults++;
        
        // Point logic - FIXED
        const userTeamIndex = match.teams.findIndex((t: any) => 
          t.players.some((p: any) => p.toString() === userId)
        );
        if (r.pointTo === userTeamIndex + 1) {
          totalPointsWon++;
        }
      });
    });
    consistency += (aces + smashes + drops) / (nets + outs + doubleFaults + 1);

    // Winner logic - FIXED
    const userTeam = match.teams.find((t: any) => 
      t.players.some((p: any) => p.toString() === userId)
    );
    if (userTeam && match.winner?.toString() === userTeam._id?.toString()) {
      wins++;
    } else {
      losses++;
    }
  }

  return {
    sport: "Tennis",
    aces,
    smashes,
    drops,
    outs,
    nets,
    doubleFaults,
    totalPointsWon,
    consistencyScore: Number((consistency / matchesPlayed).toFixed(2)),
    matchesPlayed,
    wins,
    losses,
    minsPlayed,
  };
};

const pickleballStats = async (userId: string, filters: any) => {
  const matches = await getMatchModel("pickleball").find({
    "teams.players": userId,
    ...(filters.type !== "all" && { type: filters.type }),
    ...(filters.date && { createdAt: filters.date }),
  });

  let aces = 0,
    dinks = 0,
    volleys = 0,
    smashes = 0,
    serviceFaults = 0,
    outs = 0,
    unforcedErrors = 0,
    totalPointsWon = 0,
    matchesPlayed = matches.length,
    wins = 0,
    losses = 0,
    consistency = 0,
    minsPlayed = 0;

  for (const match of matches) {
    minsPlayed += match.durationMinutes || 0;

    match.games.forEach((game: any) => {
      game.rallyLog.forEach((r: any) => {
        if (r.playerId?.toString() !== userId) return;
        if (r.eventType === "Ace") aces++;
        if (r.eventType === "Volley") volleys++;
        if (r.eventType === "Smash") smashes++;
        if (r.eventType === "Dink") dinks++;
        if (r.eventType === "ServiceFault") serviceFaults++;
        if (r.eventType === "Out") outs++;
        if (["Out", "ServiceFault"].includes(r.eventType)) unforcedErrors++;
        totalPointsWon += r.pointTo === userId ? 1 : 0;
      });
    });

    consistency += (smashes + volleys + dinks + aces) / (unforcedErrors + 1);

    const teamIndex = match.teams.findIndex((t: any) => t.players.includes(userId));
    if (teamIndex !== -1) {
      const myTeamWon = match.winner?.toString() === match.teams[teamIndex]?._id?.toString();
      if (myTeamWon) wins++;
      else losses++;
    }
  }

  return {
    sport: "Pickleball",
    aces,
    volleys,
    smashes,
    dinks,
    serviceFaults,
    outs,
    unforcedErrors,
    consistencyScore: Number((consistency / matchesPlayed).toFixed(2)),
    totalPointsWon,
    matchesPlayed,
    wins,
    losses,
    minsPlayed,
  };
};

const volleyballStats = async (userId: string, filters: any) => {
  const matches = await getMatchModel("volleyball").find({
    "teams.players": userId,
    ...(filters.type !== "all" && { type: filters.type }),
    ...(filters.date && { createdAt: filters.date }),
  });

  let spikes = 0,
    blocks = 0,
    aces = 0,
    digs = 0,
    serves = 0,
    serviceFaults = 0,
    matchesPlayed = matches.length,
    wins = 0,
    losses = 0,
    minsPlayed = 0,
    consistency = 0;

  for (const match of matches) {
    minsPlayed += match.durationMinutes || 0;

    match.feed.forEach((f: any) => {
      if (f.playerId?.toString() !== userId) return;
      if (f.type === "spike") spikes++;
      if (f.type === "block") blocks++;
      if (f.type === "ace") aces++;
      if (f.type === "dig") digs++;
      if (f.type === "serve") serves++;
      if (f.type === "service_fault") serviceFaults++;
    });

    const teamIndex = match.teams.findIndex((t: any) => t.players.includes(userId));
    if (teamIndex !== -1) {
      const myTeamWon = match.winner?.toString() === match.teams[teamIndex]?._id?.toString();
      if (myTeamWon) wins++;
      else losses++;
    }

    consistency += (spikes + blocks + digs + aces) / (serviceFaults + 1);
  }

  return {
    sport: "Volleyball",
    spikes,
    blocks,
    aces,
    digs,
    serves,
    serviceFaults,
    matchesPlayed,
    consistencyScore: Number((consistency / matchesPlayed).toFixed(2)),
    wins,
    losses,
    minsPlayed,
  };
};

const basketballStats = async (userId: string, filters: any) => {
  const matches = await getMatchModel("basketball").find({
    "teams.players": userId,
    ...(filters.type !== "all" && { type: filters.type }),
    ...(filters.date && { createdAt: filters.date }),
  });

  let points = 0,
    assists = 0,
    rebounds = 0,
    steals = 0,
    blocks = 0,
    fouls = 0,
    turnovers = 0,
    matchesPlayed = matches.length,
    wins = 0,
    losses = 0,
    minsPlayed = 0;

  for (const match of matches) {
    minsPlayed += match.durationMinutes || 0;

    match.feed.forEach((f: any) => {
      if (f.playerId?.toString() !== userId) return;
      if (f.type === "score") points += f.points || 0;
      if (f.type === "assist") assists++;
      if (f.type === "rebound") rebounds++;
      if (f.type === "steal") steals++;
      if (f.type === "block") blocks++;
      if (f.type === "turnover") turnovers++;
      if (f.type === "foul") fouls++;
    });

    const teamIndex = match.teams.findIndex((t: any) => t.players.includes(userId));
    if (teamIndex !== -1) {
      const myTeamWon = match.winner?.toString() === match.teams[teamIndex]?._id?.toString();
      if (myTeamWon) wins++;
      else losses++;
    }
  }

  return {
    sport: "Basketball",
    points,
    assists,
    rebounds,
    steals,
    blocks,
    fouls,
    turnovers,
    matchesPlayed,
    wins,
    losses,
    minsPlayed,
  };
};



// Repeat similar small functions for Volleyball, Tennis, Basketball, Pickleball
// Each returns { sport, keyStats... }

// ------------------ MAIN CONTROLLERS ------------------

export const getUserPerformance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { type = "all", range = "7" } = req.query;

    const filters = {
      type: type === "tournament" ? "tournament" : "individual",
      date: getDateRange(range as string),
    };

    const [football, badminton] = await Promise.all([
      footballStats(userId, filters),
      badmintonStats(userId, filters),
    ]);

    res.status(200).json({
      userId,
      filters,
      sports: [football, badminton],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching performance", err });
  }
};

export const getUserPerformanceBySport = async (req: Request, res: Response) => {
  try {
    const { userId, sport } = req.params;
    const { type = "all", range = "7" } = req.query;

    const filters = {
      type: type === "tournament" ? "tournament" : "individual",
      date: getDateRange(range as string),
    };

    let data;
    if (sport === "football") data = await footballStats(userId, filters);
    else if (sport === "badminton") data = await badmintonStats(userId, filters);
    else if (sport === "tennis") data = await tennisStats(userId, filters);
    else if (sport === "pickleball") data = await pickleballStats(userId, filters);
    else if (sport === "volleyball") data = await volleyballStats(userId, filters);
    else if (sport === "basketball") data = await basketballStats(userId, filters);
    else {
      return res.status(400).json({ message: `Unsupported sport type: ${sport}` });
    }
    // Extend similarly for other sports

    res.status(200).json({ userId, sport, filters, performance: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching sport performance", err });
  }
};
