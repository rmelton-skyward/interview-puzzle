import cors from 'cors';
import express from 'express';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { bookingRouter } from './routes/bookings.js';
import { healthRouter } from './routes/health.js';
import { venueRouter } from './routes/venues.js';

/** Builds the Express app without starting a listener, so tests can exercise it via Supertest. */
export function createApp() {
  const app = express();

  app.use(pinoHttp({ autoLogging: process.env.NODE_ENV !== 'test', level: process.env.NODE_ENV === 'test' ? 'silent' : 'info' }));
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
  app.use(express.json());
  app.use(apiRateLimiter);

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  app.use('/api/health', healthRouter);
  app.use('/api/venues', venueRouter);
  app.use('/api/bookings', bookingRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
