import { Router } from 'express';
import {
  createCourt,
  getCourts,
  getCourtById,
  updateCourt,
  deleteCourt,
  getAvailableSlots,
} from '../controllers/court.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/courts:
 *   post:
 *     summary: Create a new court
 *     tags: [Courts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courtName:
 *                 type: string
 *               courtSportType:
 *                 type: string
 *               surfaceType:
 *                 type: string
 *               courtSize:
 *                 type: string
 *               isIndoor:
 *                 type: boolean
 *               hasLighting:
 *                 type: boolean
 *               courtImages:
 *                 type: object
 *                 properties:
 *                   cover:
 *                     type: string
 *                   logo:
 *                     type: string
 *                   others:
 *                     type: array
 *                     items:
 *                       type: string
 *               courtSlotDuration:
 *                 type: integer
 *               courtMaxPeople:
 *                 type: integer
 *               courtPricePerSlot:
 *                 type: number
 *               courtPeakEnabled:
 *                 type: boolean
 *               courtPeakDays:
 *                 type: array
 *                 items:
 *                   type: string
 *               courtPeakStart:
 *                 type: string
 *               courtPeakEnd:
 *                 type: string
 *               courtPeakPricePerSlot:
 *                 type: number
 *     responses:
 *       201:
 *         description: Court created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authenticate, authorize(1, 2), createCourt);

/**
 * @swagger
 * /api/courts:
 *   get:
 *     summary: Get all courts
 *     tags: [Courts]
 *     parameters:
 *       - in: query
 *         name: venue
 *         schema:
 *           type: string
 *       - in: query
 *         name: sportType
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Courts retrieved successfully
 */
router.get('/', getCourts);

/**
 * @swagger
 * /api/courts/{id}:
 *   get:
 *     summary: Get court by ID
 *     tags: [Courts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Court retrieved successfully
 *       404:
 *         description: Court not found
 */
router.get('/:id', getCourtById);

/**
 * @swagger
 * /api/courts/{id}:
 *   put:
 *     summary: Update court
 *     tags: [Courts]
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
 *         description: Court updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Court not found
 */
router.put('/:id', authenticate, authorize(1, 2), updateCourt);

/**
 * @swagger
 * /api/courts/{id}:
 *   delete:
 *     summary: Delete court
 *     tags: [Courts]
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
 *         description: Court deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Court not found
 */
router.delete('/:id', authenticate, authorize(1, 2), deleteCourt);

/**
 * @swagger
 * /api/courts/{id}/available-slots:
 *   get:
 *     summary: Get available time slots for a court
 *     tags: [Courts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 *       400:
 *         description: Date is required
 *       404:
 *         description: Court not found
 */
router.get('/:id/available-slots', getAvailableSlots);

export default router;