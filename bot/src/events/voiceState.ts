import type { VoiceState } from "discord.js";
import { logger } from "../utils/logger.js";
import { recordingManager } from "../modules/recorder/state.js";
import { onRegionRelevantUpdate } from "../modules/stayConnected/regionWatcher.js";

export async function onVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState
): Promise<void> {
  try {
    // Update active recording's event timeline (camera/share/mute changes)
    recordingManager.handleVoiceStateChange(oldState, newState);

    // Region watcher: detect bot being kicked / channel changes
    await onRegionRelevantUpdate(oldState, newState);
  } catch (err) {
    logger.error({ err }, "voiceStateUpdate error");
  }
}
