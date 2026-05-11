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
  log.info(
    { profileDir, headless: cfg.HEADLESS, platform: process.platform },
    "launching chromium with persistent profile"
  );

  const ctx = await chromium.launchPersistentContext(profileDir, {
    headless: cfg.HEADLESS,
    viewport: { width: cfg.CAPTURE_WIDTH, height: cfg.CAPTURE_HEIGHT },
    args: [
      "--no-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--use-fake-ui-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
      "--enable-features=WebRTCPipeWireCapturer",
    ],
    ignoreDefaultArgs: ["--mute-audio"],
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());

  // First navigate to /app — if we already have a session in the persistent
  // profile, we'll land on the client without needing token injection.
  await page.goto("https://discord.com/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const loggedIn = await page
    .waitForURL(/\/channels\//, { timeout: 4000 })
    .then(() => true)
    .catch(() => false);

  if (!loggedIn) {
    log.info("no existing session — injecting user token");
    await page.goto("https://discord.com/login", { waitUntil: "domcontentloaded" });
    await page.evaluate((token) => {
      function login(t: string): void {
        const w = window as unknown as {
          localStorage: Storage;
          location: { reload: () => void };
        };
        setInterval(() => {
          try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "/api/v9/users/@me");
            xhr.setRequestHeader("Authorization", t);
            xhr.send();
          } catch {
            /* ignore */
          }
        }, 50);
        setTimeout(() => {
          w.localStorage.setItem("token", `"${t}"`);
          w.location.reload();
        }, 1500);
      }
      login(token);
    }, cfg.DISCORD_USER_TOKEN);

    await page
      .waitForURL(/\/channels\//, { timeout: 60_000 })
      .catch(() => log.warn("did not reach /channels — token might be invalid"));
  } else {
    log.info("existing session reused");
  }

  return { ctx, page };
}
