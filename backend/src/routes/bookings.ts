import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { CreateBookingRequestSchema } from '../schemas/booking.js';
import { createBooking, getBooking } from '../services/bookingService.js';

export const bookingRouter = Router();

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Book a set of seats for a venue
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [venueId, seatIds]
 *             properties:
 *               venueId: { type: string }
 *               seatIds: { type: array, items: { type: string }, minItems: 1 }
 *     responses:
 *       201:
 *         description: Booking created
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Venue or one or more seats not found
 *       409:
 *         description: One or more seats are no longer available
 */
bookingRouter.post('/', validateBody(CreateBookingRequestSchema), async (req, res) => {
  const booking = await createBooking(req.body);
  res.status(201).json(booking);
});

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a booking by id
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The booking with its seats
 *       404:
 *         description: Booking not found
 */
bookingRouter.get<{ id: string }>('/:id', async (req, res) => {
  const booking = await getBooking(req.params.id);
  res.json(booking);
});
