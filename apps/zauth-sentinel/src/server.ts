import { config } from "./config.js";
import { initializeDatabase } from "./db/init.js";
import { seedDatabase } from "./db/seed.js";
import { ensureRankOrderFunction } from "./services/personnelService.js";
import { createApp } from "./app.js";

export async function bootstrap(): Promise<void> {
  await initializeDatabase();
  await ensureRankOrderFunction();
  await seedDatabase();
  const app = createApp();

  app.listen(config.sentinelPort, config.sentinelHost, () => {
    console.log(`zauth-sentinel listening on ${config.sentinelHost}:${config.sentinelPort}`);
  });
}
