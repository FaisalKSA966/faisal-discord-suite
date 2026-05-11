import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type VoiceState,
} from "discord.js";
import { logger } from "../../utils/logger.js";
import { getGuildSettings } from "../../db/settings.js";

const log = logger.child({ mod: "region-watcher" });

interface SwitchTracker {
  lastSwitchTs: number;
  failureCount: number;
}
const trackers = new Map<string, SwitchTracker>();

const COOLDOWN_MS = 60_000;
const FAILURE_THRESHOLD = 3;

/**
 * Detect voice trouble heuristically. Discord doesn't expose "voice region quality" directly,
 * but voiceStateUpdate fires frequently when there's churn. We treat sudden bursts of
 * "user reconnected/joined" events on the bot's pinned channel as a trouble signal.
 *
 * The more robust approach: simply schedule a region rotation if many `voiceStateUpdate`
 * events fire in a short window, OR if `/region cycle` is invoked manually.
 */
export async function onRegionRelevantUpdate(
  oldState: VoiceState,
  newState: VoiceState
): Promise<void> {
  const guild = (newState.guild ?? oldState.guild) as Guild;
  const settings = getGuildSettings(guild.id);
  if (!settings.auto_region || !settings.pin_channel_id) return;

  const pinChannel = guild.channels.cache.get(settings.pin_channel_id);
  if (!pinChannel || pinChannel.type !== ChannelType.GuildVoice) return;

  // Only respond to states involving the pinned channel
  if (
    newState.channelId !== settings.pin_channel_id &&
    oldState.channelId !== settings.pin_channel_id
  )
    return;

  // Heuristic: same user joined+left+joined within short interval => "reconnecting"
  // We use a sliding counter per guild.
  const tracker = trackers.get(guild.id) ?? { lastSwitchTs: 0, failureCount: 0 };
  trackers.set(guild.id, tracker);

  const looksLikeReconnect =
    oldState.channelId === settings.pin_channel_id &&
    newState.channelId === settings.pin_channel_id &&
    oldState.sessionId !== newState.sessionId;

  if (looksLikeReconnect) {
    tracker.failureCount += 1;
    log.debug(
      { guild: guild.id, count: tracker.failureCount },
      "reconnect-like event"
    );
  }

  if (tracker.failureCount >= FAILURE_THRESHOLD) {
    const now = Date.now();
    if (now - tracker.lastSwitchTs < COOLDOWN_MS) return;
    tracker.lastSwitchTs = now;
    tracker.failureCount = 0;
    await rotateRegion(guild, settings.pin_channel_id, settings.target_region ?? null);
  }
}

const REGION_ROTATION = [
  null,
  "rotterdam",
  "frankfurt",
  "amsterdam",
  "us-east",
  "us-central",
  "stockholm",
  "london",
];

export async function rotateRegion(
  guild: Guild,
  channelId: string,
  preferred: string | null
): Promise<void> {
  const channel = guild.channels.cache.get(channelId);
  if (!channel || channel.type !== ChannelType.GuildVoice) return;
  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    log.warn("missing ManageChannels — cannot rotate region");
    return;
  }
  // Try preferred first, then null (Automatic), then next in rotation.
  const order = preferred
    ? [preferred, null, ...REGION_ROTATION.filter((r) => r !== preferred)]
    : REGION_ROTATION;
  const currentRegion = channel.rtcRegion;
  for (const r of order) {
    if (r === currentRegion) continue;
    try {
      await channel.setRTCRegion(r, "auto-region: bot detected voice trouble");
      log.info({ from: currentRegion, to: r ?? "automatic" }, "region switched");
      return;
    } catch (err) {
      log.warn({ err, r }, "region switch failed");
    }
  }
}

export async function manualRotate(guild: Guild, channelId: string): Promise<void> {
  const s = getGuildSettings(guild.id);
  await rotateRegion(guild, channelId, s.target_region ?? null);
}
