import { Router } from 'express';
import { listVenues } from '../repositories/venueRepository.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { validateBody } from '../middleware/validate.js';
import { BestSeatsRequestSchema, CreateVenueRequestSchema, SeatAssistantRequestSchema } from '../schemas/venue.js';
import { findSeatsFromNaturalLanguage } from '../services/seatAssistantService.js';
import { createVenue, getBestSeats, getVenueStatus, removeVenue } from '../services/venueService.js';

export const venueRouter = Router();

venueRouter.get('/', async (_req, res, next) => {
  try {
    const venues = await listVenues();
    res.json(venues);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /venues:
 *   post:
 *     summary: Create a venue and generate its seats
 *     tags: [Venues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, rows, columns]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 100 }
 *               rows: { type: integer, minimum: 1, maximum: 100 }
 *               columns: { type: integer, minimum: 1, maximum: 100 }
 *     responses:
 *       201: { description: Venue created }
 *       400: { description: Invalid venue configuration }
 */
venueRouter.post('/', requireAdmin, validateBody(CreateVenueRequestSchema), async (req, res, next) => {
  try {
    const venue = await createVenue(req.body);
    res.status(201).json(venue);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /venues/{id}:
 *   delete:
 *     summary: Delete a venue and cascade its seats and bookings
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Venue deleted }
 *       404: { description: Venue not found }
 */
venueRouter.delete<{ id: string }>('/:id', requireAdmin, async (req, res, next) => {
  try {
    await removeVenue(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /venues/{id}/seat-assistant:
 *   post:
 *     summary: Interpret a natural-language seat request and return deterministic recommendations
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prompt]
 *             properties:
 *               prompt: { type: string, minLength: 3, maxLength: 500 }
 *     responses:
 *       200: { description: AI-interpreted seat recommendation }
 *       503: { description: AI provider unavailable }
 */
venueRouter.post<{ id: string }>(
  '/:id/seat-assistant',
  validateBody(SeatAssistantRequestSchema),
  async (req, res, next) => {
    try {
      const result = await findSeatsFromNaturalLanguage(req.params.id, req.body.prompt);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /venues/{id}:
 *   get:
 *     summary: Get a venue's layout and current seat map
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Venue layout and seats
 *       404:
 *         description: Venue not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
venueRouter.get<{ id: string }>('/:id', async (req, res, next) => {
  try {
    const status = await getVenueStatus(req.params.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /venues/{id}/best-seats:
 *   post:
 *     summary: Find the best available contiguous seats for a party size and scene (read-only)
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [partySize]
 *             properties:
 *               partySize: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: The best available contiguous seats
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BestSeatsResult' }
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Venue not found, or no contiguous block fits the party size
 */
venueRouter.post<{ id: string }>(
  '/:id/best-seats',
  validateBody(BestSeatsRequestSchema),
  async (req, res, next) => {
    try {
      const result = await getBestSeats(req.params.id, req.body.partySize);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);
