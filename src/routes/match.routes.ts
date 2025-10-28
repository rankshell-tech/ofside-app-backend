// src/routes/match.routes.ts
import { Router } from "express";
import { createMatch, getMatch } from "../controllers/match.controller";

const router = Router();

/**
 * @swagger
 * /api/matches:
 *   post:
 *     summary: Create a new match
 *     tags: [Matches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Match created successfully
 *       400:
 *         description: Bad request
 */
router.post("/", createMatch);

/**
 * @swagger
 * /api/matches/{sport}/{id}:
 *   get:
 *     summary: Get a match by sport and ID
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: sport
 *         required: true
 *         schema:
 *           type: string
 *         description: The sport type
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The match ID
 *     responses:
 *       200:
 *         description: Match found
 *       404:
 *         description: Match not found
 */
router.get("/:sport/:id", getMatch);

export default router;
