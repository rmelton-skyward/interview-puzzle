import { Router } from 'express';
import { requireAdmin } from '../middleware/adminAuth.js';
import { validateBody } from '../middleware/validate.js';
import { BestSeatsRequestSchema, CreateVenueRequestSchema, SeatAssistantRequestSchema } from '../schemas/venue.js';
import { findSeatsFromNaturalLanguage } from '../services/seatAssistantService.js';
import { createVenue, getBestSeats, getVenueStatus, getVenues, removeVenue } from '../services/venueService.js';

export const venueRouter = Router();

venueRouter.get('/', async (_req, res) => {
  const venues = await getVenues();
  res.json(venues);
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
 *               name: { type: string, minLength: 1, maxLength: 30 }
 *               rows: { type: integer, minimum: 1, maximum: 50 }
 *               columns: { type: integer, minimum: 1, maximum: 1000 }
 *     responses:
 *       201: { description: Venue created }
 *       400: { description: Invalid venue configuration }
 *       409: { description: A venue with this name already exists }
 */
venueRouter.post('/', requireAdmin, validateBody(CreateVenueRequestSchema), async (req, res) => {
  const venue = await createVenue(req.body);
  res.status(201).json(venue);
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
venueRouter.delete<{ id: string }>('/:id', requireAdmin, async (req, res) => {
  await removeVenue(req.params.id);
  res.status(204).send();
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
  async (req, res) => {
    const result = await findSeatsFromNaturalLanguage(req.params.id, req.body.prompt);
    res.json(result);
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
venueRouter.get<{ id: string }>('/:id', async (req, res) => {
  const status = await getVenueStatus(req.params.id);
  res.json(status);
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
  async (req, res) => {
    const result = await getBestSeats(req.params.id, req.body.partySize);
    res.json(result);
  },
);
