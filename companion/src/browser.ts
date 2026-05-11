import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright-core";
import { cfg } from "./config.js";
import { logger } from "./logger.js";

const log = logger.child({ mod: "browser" });

export async function launchDiscord(): Promise<{
  ctx: BrowserContext;
  page: Page;
}> {
  const profileDir = path.resolve(cfg.BROWSER_PROFILE_DIR);
  log.info({ profileDir }, "launching chromium with persistent profile");
  const ctx = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: { width: cfg.CAPTURE_WIDTH, height: cfg.CAPTURE_HEIGHT },
    args: [
      "--no-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--use-fake-ui-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
    ],
    ignoreDefaultArgs: ["--mute-audio"],
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());

  // Inject user token via localStorage hack (Discord stores token in localStorage).
  await page.goto("https://discord.com/login");
  await page.evaluate((token) => {
    function login(token: string): void {
      setInterval(() => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/v9/users/@me");
        xhr.setRequestHeader("Authorization", token);
        xhr.send();
      }, 50);
      setTimeout(() => {
        (window as unknown as { localStorage: Storage }).localStorage.setItem(
          "token",
          `"${token}"`
        );
        window.location.reload();
      }, 1500);
    }
    login(token);
  }, cfg.DISCORD_USER_TOKEN);

  await page.waitForURL(/\/channels\//, { timeout: 60_000 }).catch(() => {
    log.warn("did not reach /channels — token might be invalid");
  });

  // Navigate to target channel
  const url = `https://discord.com/channels/${cfg.TARGET_GUILD_ID}/${cfg.TARGET_VOICE_CHANNEL_ID}`;
  log.info({ url }, "navigating to target channel");
  await page.goto(url);
  await page.waitForLoadState("domcontentloaded");

  return { ctx, page };
}
