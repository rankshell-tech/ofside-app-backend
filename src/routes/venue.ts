import { Router } from 'express';
import {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
  approveVenue,
  getOwnerVenues,
} from '../controllers/venueController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/venues:
 *   post:
 *     summary: Create a new venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - venueName
 *               - description
 *               - contactPersonName
 *               - contactPhone
 *               - contactEmail
 *               - city
 *               - pincode
 *               - courts
 *             properties:
 *               venueName:
 *                 type: string
 *               venueType:
 *                 type: string
 *               sportsOffered:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               is24HoursOpen:
 *                 type: boolean
 *               shopNo:
 *                 type: string
 *               floorTower:
 *                 type: string
 *               areaSectorLocality:
 *                 type: string
 *               city:
 *                 type: string
 *               pincode:
 *                 type: string
 *               latitude:
 *                 type: string
 *               longitude:
 *                 type: string
 *               contactPersonName:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               ownerName:
 *                 type: string
 *               ownerPhone:
 *                 type: string
 *               ownerEmail:
 *                 type: string
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               courts:
 *                 type: array
 *                 items:
 *                   type: object
 *               declarationAgreed:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Venue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Venue'
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Venue already exists at this location
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authenticate, authorize(1, 2), createVenue);

/**
 * @swagger
 * /api/venues:
 *   get:
 *     summary: Get all venues
 *     tags: [Venues]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venues retrieved successfully
 */
router.get('/', getVenues);

/**
 * @swagger
 * /api/venues/owner:
 *   get:
 *     summary: Get venues owned by current user
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner venues retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     venues:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Venue'
 *       401:
 *         description: Unauthorized
 */
router.get('/owner', authenticate, authorize(1, 2), getOwnerVenues);

/**
 * @swagger
 * /api/venues/{id}:
 *   get:
 *     summary: Get venue by ID
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue retrieved successfully
 *       404:
 *         description: Venue not found
 */
router.get('/:id', getVenueById);

/**
 * @swagger
 * /api/venues/{id}:
 *   put:
 *     summary: Update venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               venueName:
 *                 type: string
 *               venueType:
 *                 type: string
 *               sportsOffered:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               is24HoursOpen:
 *                 type: boolean
 *               shopNo:
 *                 type: string
 *               floorTower:
 *                 type: string
 *               areaSectorLocality:
 *                 type: string
 *               city:
 *                 type: string
 *               pincode:
 *                 type: string
 *               latitude:
 *                 type: string
 *               longitude:
 *                 type: string
 *               contactPersonName:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               ownerName:
 *                 type: string
 *               ownerPhone:
 *                 type: string
 *               ownerEmail:
 *                 type: string
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               courts:
 *                 type: array
 *                 items:
 *                   type: object
 *               declarationAgreed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Venue updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Venue not found
 */
router.put('/:id', authenticate, authorize(1, 2), updateVenue);

/**
 * @swagger
 * /api/venues/{id}:
 *   delete:
 *     summary: Delete venue
 *     tags: [Venues]
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
 *         description: Venue deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Venue not found
 */
router.delete('/:id', authenticate, authorize(1, 2), deleteVenue);

/**
 * @swagger
 * /api/venues/{id}/approve:
 *   patch:
 *     summary: Approve venue (Admin only)
 *     tags: [Venues]
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
 *         description: Venue approved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Venue not found
 */
router.patch('/:id/approve', authenticate, authorize(2), approveVenue);

export default router;