import { Router } from 'express';
import { prisma } from '../db/client.js';

export const healthRouter = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check with database connectivity verification
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service and database are healthy
 *       503:
 *         description: Database is unreachable
 */
healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});
