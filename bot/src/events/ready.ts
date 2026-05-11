import type { Client } from "discord.js";
import { REST, Routes } from "discord.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export async function onReady(client: Client<true>): Promise<void> {
  // Auto-register commands on startup (idempotent).
  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
  const body = client.commands.map((c) => c.data.toJSON());
  try {
    if (env.DEFAULT_GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(env.DISCORD_APP_ID, env.DEFAULT_GUILD_ID),
        { body }
      );
      logger.info(
        { count: body.length, guild: env.DEFAULT_GUILD_ID },
        "guild slash commands deployed"
      );
    } else {
      await rest.put(Routes.applicationCommands(env.DISCORD_APP_ID), { body });
      logger.info(
        { count: body.length },
        "global slash commands deployed (may take up to 1h to appear)"
      );
    }
  } catch (err) {
    logger.error({ err }, "failed to deploy slash commands");
  }
}
