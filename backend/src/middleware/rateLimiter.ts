import rateLimit from 'express-rate-limit';

/** Simple in-memory rate limit — sufficient for a single-instance demo deployment. */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
