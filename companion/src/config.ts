import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DISCORD_USER_TOKEN: z.string().min(20, "DISCORD_USER_TOKEN مفقود — راجع companion/.env"),
  TARGET_GUILD_ID: z.string().min(5),
  TARGET_VOICE_CHANNEL_ID: z.string().min(5),
  BOT_WS_URL: z.string().default("ws://localhost:8787"),
  BOT_AUTH_TOKEN: z.string().default("change-me"),
  LISTEN_PORT: z.coerce.number().int().default(8788),
  CAPTURE_WIDTH: z.coerce.number().int().default(1280),
  CAPTURE_HEIGHT: z.coerce.number().int().default(720),
  CAPTURE_FPS: z.coerce.number().int().default(15),
  OUTPUT_DIR: z.string().default("./out"),
  BROWSER_PROFILE_DIR: z.string().default("./companion-profile"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ companion config invalid:");
  for (const i of parsed.error.issues) console.error(`  • ${i.path.join(".")}: ${i.message}`);
  process.exit(1);
}
export const cfg = parsed.data;
