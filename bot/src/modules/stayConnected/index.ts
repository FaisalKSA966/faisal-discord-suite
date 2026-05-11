import {
  type Client,
  type Guild,
  type VoiceBasedChannel,
} from "discord.js";
import {
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
  joinVoiceChannel,
} from "@discordjs/voice";
import { logger } from "../../utils/logger.js";
import { getGuildSettings } from "../../db/settings.js";
import { recordingManager } from "../recorder/state.js";

const log = logger.child({ mod: "stay" });

const HEARTBEAT_MS = 20_000;

export function initStayConnected(client: Client): void {
  client.once("ready", () => {
    setInterval(() => void heartbeat(client), HEARTBEAT_MS);
    log.info({ everyMs: HEARTBEAT_MS }, "stay-connected loop started");
  });

  // Watch all voice connection state changes
  client.on("voiceStateUpdate", async (oldS, newS) => {
    if (newS.id !== client.user?.id) return;
    if (oldS.channelId && !newS.channelId) {
      // Bot was disconnected — try to rejoin if a pin channel is set
      const guild = (newS.guild ?? oldS.guild) as Guild;
      const s = getGuildSettings(guild.id);
      if (s.auto_pin && s.pin_channel_id) {
        log.warn({ guild: guild.id }, "bot was disconnected — rejoining");
        await tryRejoin(guild, s.pin_channel_id);
      }
    }
  });
}

async function heartbeat(client: Client): Promise<void> {
  for (const [guildId, guild] of client.guilds.cache) {
    const s = getGuildSettings(guildId);
    if (!s.auto_pin || !s.pin_channel_id) continue;

    const channel = guild.channels.cache.get(s.pin_channel_id);
    if (!channel || !channel.isVoiceBased()) continue;

    const conn = getVoiceConnection(guildId);
    if (!conn || conn.state.status === VoiceConnectionStatus.Disconnected) {
      log.info({ guildId }, "heartbeat: rejoining pinned channel");
      await tryRejoin(guild, channel.id);
      continue;
    }

    // If connected but not in pinned channel, move
    if (conn.state.status === VoiceConnectionStatus.Ready) {
      const me = guild.members.me;
      if (me && me.voice.channelId !== channel.id) {
        log.warn({ guildId, want: channel.id, got: me.voice.channelId }, "drifted; moving back");
        await tryRejoin(guild, channel.id);
      }
    }
  }
}

async function tryRejoin(guild: Guild, channelId: string): Promise<void> {
  const channel = guild.channels.cache.get(channelId);
  if (!channel || !channel.isVoiceBased()) return;
  try {
    // If a recording session exists, restart it cleanly
    if (recordingManager.isActive(guild.id)) {
      await recordingManager.stop(guild.id);
    }
    joinPinned(channel);
  } catch (err) {
    log.warn({ err }, "tryRejoin failed");
  }
}

function joinPinned(channel: VoiceBasedChannel): void {
  const conn = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guildId,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: true,
  });
  conn.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(conn, VoiceConnectionStatus.Signalling, 5_000),
        entersState(conn, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      try {
        conn.destroy();
      } catch {
        /* ignore */
      }
    }
  });
}
