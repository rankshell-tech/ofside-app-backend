import { Router } from 'express';
import { Request, Response } from 'express';
import { rulebookSchema } from '../utils/validators';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest, authenticate, authorize } from '../middlewares/auth';
import Rulebook from '../models/Rulebook';

const router = Router();

/**
 * @swagger
 * /api/rulebook/{sportType}:
 *   get:
 *     summary: Get rules for a specific sport
 *     tags: [Rulebook]
 *     parameters:
 *       - in: path
 *         name: sportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [badminton, tennis, cricket, football, basketball, volleyball, table-tennis, squash]
 *     responses:
 *       200:
 *         description: Rules retrieved successfully
 *       404:
 *         description: Rules not found for this sport
 */
const getRules = asyncHandler(async (req: Request, res: Response) => {
  const { sportType } = req.params;

  // Now, rulebook.rules is a single string field containing all rules for the sport
  const rulebook = await Rulebook.findOne({ sportType });

  if (!rulebook) {
    throw createError('Rules not found for this sport', 404);
  }

  res.status(200).json({
    success: true,
    data: { rulebook },
  });
});

/**
 * @swagger
 * /api/rulebook:
 *   post:
 *     summary: Create or update rules for a sport (Admin only)
 *     tags: [Rulebook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Rules created/updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
/**
 * @swagger
 * /api/rulebook:
 *   post:
 *     summary: Create or update rules for a sport (Admin only)
 *     tags: [Rulebook]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sportType
 *               - rules
 *             properties:
 *               sportType:
 *                 type: string
 *                 description: The type of sport (e.g., football, cricket)
 *               rules:
 *                 type: string
 *                 description: All rules for the sport as a string
 *     responses:
 *       201:
 *         description: Rules created successfully
 *       200:
 *         description: Rules updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
const createOrUpdateRules = asyncHandler(async (req: AuthRequest, res: Response) => {
  // The rulebook data should be sent in the request body as JSON:
  // { "sportType": "football", "rules": "All rules as a string..." }
  const validatedData = rulebookSchema.parse(req.body);

  const existingRulebook = await Rulebook.findOne({ sportType: validatedData.sportType });

  if (existingRulebook) {
    existingRulebook.rules = validatedData.rules;
    await existingRulebook.save();

    res.status(200).json({
      success: true,
      message: 'Rules updated successfully',
      data: { rulebook: existingRulebook },
    });
  } else {
    const rulebook = await Rulebook.create(validatedData);

    res.status(201).json({
      success: true,
      message: 'Rules created successfully',
      data: { rulebook },
    });
  }
});

/**
 * @swagger
 * /api/rulebook:
 *   get:
 *     summary: Get all rulebooks
 *     tags: [Rulebook]
 *     responses:
 *       200:
 *         description: All rulebooks retrieved successfully
 */
const getAllRulebooks = asyncHandler(async (req: Request, res: Response) => {
  // Each rulebook.rules is now a string field
  const rulebooks = await Rulebook.find().sort({ sportType: 1 });

  res.status(200).json({
    success: true,
    data: { rulebooks },
  });
});

/**
 * @swagger
 * /api/rulebook/{sportType}:
 *   delete:
 *     summary: Delete rules for a sport (Admin only)
 *     tags: [Rulebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sportType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rules deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Rules not found
 */
const deleteRules = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sportType } = req.params;

  const rulebook = await Rulebook.findOneAndDelete({ sportType });

  if (!rulebook) {
    throw createError('Rules not found for this sport', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Rules deleted successfully',
  });
});

router.get('/', getAllRulebooks);
router.get('/:sportType', getRules);
router.post('/', authenticate, authorize(2), createOrUpdateRules);
router.delete('/:sportType', authenticate, authorize(2), deleteRules);

export default router;
