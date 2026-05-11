import { cfg } from "./config.js";
import { logger } from "./logger.js";
import { launchDiscord } from "./browser.js";
import { startBridge } from "./bridge.js";

async function main(): Promise<void> {
  logger.info({ guild: cfg.TARGET_GUILD_ID, channel: cfg.TARGET_VOICE_CHANNEL_ID }, "companion starting");
  startBridge();
  const { page } = await launchDiscord();
  logger.info("companion ready — discord web loaded");

  // Keep the page alive
  page.on("close", () => {
    logger.warn("discord page closed — exiting");
    process.exit(0);
  });
}

void main().catch((err) => {
  logger.error({ err }, "companion fatal");
  process.exit(1);
});
