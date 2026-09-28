import { createApp } from './app.js';
import { environment } from './config/environment.js';
import { prisma } from './db/client.js';
import { ensureDefaultVenue } from './services/venueService.js';

const app = createApp();

async function startServer() {
  await ensureDefaultVenue();
  app.listen(environment.PORT, () => {
    console.log(`Backend listening on http://localhost:${environment.PORT}`);
  });
}

void startServer().catch(async (error: unknown) => {
  console.error('Backend startup failed', error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
