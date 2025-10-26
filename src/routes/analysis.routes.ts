import { Router } from 'express';
import {  Response } from 'express';
import { matchSchema, playerStatsSchema } from '../utils/validators';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest, authenticate } from '../middlewares/auth';
import Match from '../models/Match';
import PlayerStats from '../models/PlayerStats';
import Court from '../models/Court';

const router = Router();

/**
 * @swagger
 * /api/analysis/matches:
 *   post:
 *     summary: Create a new match
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Match created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
const createMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = matchSchema.parse(req.body);
  
  // Check if court exists
  const court = await Court.findById(validatedData.courtId).populate('venue');
  if (!court) {
    throw createError('Court not found', 404);
  }
  
  const match = await Match.create({
    court: validatedData.courtId,
    venue: (court.venue as any)._id,
    sportType: court.sportType,
    date: new Date(validatedData.date),
    startTime: validatedData.startTime,
    endTime: validatedData.endTime,
    players: validatedData.players,
  });
  
  res.status(201).json({
    success: true,
    message: 'Match created successfully',
    data: { match },
  });
});

/**
 * @swagger
 * /api/analysis/matches:
 *   get:
 *     summary: Get matches
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sportType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, ongoing, completed, cancelled]
 *       - in: query
 *         name: playerId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matches retrieved successfully
 *       401:
 *         description: Unauthorized
 */
const getMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const filters: any = {};
  
  // Filter by sport type
  if (req.query.sportType) {
    filters.sportType = req.query.sportType;
  }
  
  // Filter by status
  if (req.query.status) {
    filters.status = req.query.status;
  }
  
  // Filter by player
  if (req.query.playerId) {
    filters.players = { $in: [req.query.playerId] };
  }
  
  // If user is not admin, only show matches they are part of
  if (req.user?.role !== 2) {
    filters.players = { $in: [req.user?.userId] };
  }
  
  const matches = await Match.find(filters)
    .populate('court', 'courtName')
    .populate('venue', 'venueName')
    .populate('players', 'name mobile')
    .sort({ date: -1, startTime: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Match.countDocuments(filters);
  
  res.status(200).json({
    success: true,
    data: {
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @swagger
 * /api/analysis/matches/{id}/complete:
 *   patch:
 *     summary: Complete a match and update score
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match completed successfully
 *       404:
 *         description: Match not found
 *       401:
 *         description: Unauthorized
 */
const completeMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { score } = req.body;
  
  const match = await Match.findById(id);
  
  if (!match) {
    throw createError('Match not found', 404);
  }
  
  // Check if user is part of the match or is admin
  if (req.user?.role !== 2 && !match.players.includes(req.user?.userId as any)) {
    throw createError('Not authorized to complete this match', 403);
  }
  
  match.status = 'completed';
  match.score = score;
  await match.save();
  
  res.status(200).json({
    success: true,
    message: 'Match completed successfully',
    data: { match },
  });
});

/**
 * @swagger
 * /api/analysis/stats:
 *   post:
 *     summary: Add player statistics for a match
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Player stats added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
const addPlayerStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = playerStatsSchema.parse(req.body);
  
  // Check if match exists and is completed
  const match = await Match.findById(validatedData.matchId);
  if (!match) {
    throw createError('Match not found', 404);
  }
  
  if (match.status !== 'completed') {
    throw createError('Can only add stats for completed matches', 400);
  }
  
  // Check if user is part of the match or is admin
  if (req.user?.role !== 2 && !match.players.includes(req.user?.userId as any)) {
    throw createError('Not authorized to add stats for this match', 403);
  }
  
  // Check if stats already exist for this player and match
  const existingStats = await PlayerStats.findOne({
    player: req.user?.userId,
    match: validatedData.matchId,
  });
  
  if (existingStats) {
    // Update existing stats
    Object.assign(existingStats.stats, validatedData.stats);
    await existingStats.save();
    
    res.status(200).json({
      success: true,
      message: 'Player stats updated successfully',
      data: { stats: existingStats },
    });
  } else {
    // Create new stats
    const stats = await PlayerStats.create({
      player: req.user?.userId,
      match: validatedData.matchId,
      sportType: match.sportType,
      stats: validatedData.stats,
    });
    
    res.status(201).json({
      success: true,
      message: 'Player stats added successfully',
      data: { stats },
    });
  }
});

/**
 * @swagger
 * /api/analysis/player/{playerId}/dashboard:
 *   get:
 *     summary: Get player analytics dashboard
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sportType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player dashboard retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
const getPlayerDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { playerId } = req.params;
  const { sportType } = req.query;
  
  // Check authorization (users can see their own stats, admins can see all)
  if (req.user?.role !== 2 && playerId !== req.user?.userId) {
    throw createError('Not authorized to view this player\'s dashboard', 403);
  }
  
  const filters: any = { player: playerId };
  
  if (sportType) {
    filters.sportType = sportType;
  }
  
  // Get player stats
  const playerStats = await PlayerStats.find(filters)
    .populate('match', 'date sportType status')
    .sort({ createdAt: -1 });
  
  // Calculate aggregated stats
  const aggregatedStats = playerStats.reduce((acc, stat) => {
    const sport = stat.sportType;
    
    if (!acc[sport]) {
      acc[sport] = {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        totalScores: 0,
        totalAssists: 0,
        totalGoals: 0,
      };
    }
    
    acc[sport].totalMatches += 1;
    acc[sport].wins += stat.stats.wins || 0;
    acc[sport].losses += stat.stats.losses || 0;
    acc[sport].totalScores += stat.stats.scores || 0;
    acc[sport].totalAssists += stat.stats.assists || 0;
    acc[sport].totalGoals += stat.stats.goals || 0;
    
    return acc;
  }, {} as any);
  
  // Calculate win rates and averages
  Object.keys(aggregatedStats).forEach(sport => {
    const stats = aggregatedStats[sport];
    stats.winRate = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0;
    stats.averageScore = stats.totalMatches > 0 ? stats.totalScores / stats.totalMatches : 0;
    stats.averageAssists = stats.totalMatches > 0 ? stats.totalAssists / stats.totalMatches : 0;
    stats.averageGoals = stats.totalMatches > 0 ? stats.totalGoals / stats.totalMatches : 0;
  });
  
  // Get recent matches
  const recentMatches = await Match.find({ players: { $in: [playerId] } })
    .populate('court', 'courtName')
    .populate('venue', 'venueName')
    .sort({ date: -1 })
    .limit(5);
  
  res.status(200).json({
    success: true,
    data: {
      aggregatedStats,
      recentMatches,
      totalStats: playerStats.length,
    },
  });
});

router.post('/matches', authenticate, createMatch);
router.get('/matches', authenticate, getMatches);
router.patch('/matches/:id/complete', authenticate, completeMatch);
router.post('/stats', authenticate, addPlayerStats);
router.get('/player/:playerId/dashboard', authenticate, getPlayerDashboard);

export default router;