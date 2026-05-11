import type { Message } from "discord.js";
import { recordingManager } from "../modules/recorder/state.js";

export async function onMessageCreate(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!message.guildId) return;
  recordingManager.handleChatMessage(message);
}
