import type { Client } from "discord.js";
import { onReady } from "./ready.js";
import { onInteractionCreate } from "./interactionCreate.js";
import { onVoiceStateUpdate } from "./voiceState.js";
import { onMessageCreate } from "./messageCreate.js";
import { logger } from "../utils/logger.js";

export async function registerAllEvents(client: Client): Promise<void> {
  client.on("ready", (c) => void onReady(c));
  client.on("interactionCreate", (i) => void onInteractionCreate(i));
  client.on("voiceStateUpdate", (oldS, newS) =>
    void onVoiceStateUpdate(oldS, newS)
  );
  client.on("messageCreate", (m) => void onMessageCreate(m));
  logger.info("events registered");
}
