import {
  joinVoiceChannel,
  EndBehaviorType,
  VoiceConnectionStatus,
  entersState,
  type VoiceConnection,
} from "@discordjs/voice";
import type { VoiceBasedChannel, GuildMember } from "discord.js";
import prism from "prism-media";
import { logger } from "../../utils/logger.js";
import { RollingBuffer } from "./rollingBuffer.js";
import { EventTimeline } from "./eventTimeline.js";

const log = logger.child({ mod: "voice-conn" });

export interface VoiceSession {
  channel: VoiceBasedChannel;
  connection: VoiceConnection;
  buffer: RollingBuffer;
  timeline: EventTimeline;
  cleanup: () => void;
}

/**
 * Join a voice channel and start receiving audio from every speaker.
 * Subscribes to receiver "speaking" events and pipes decoded PCM into the rolling buffer.
 */
export async function joinAndCapture(args: {
  channel: VoiceBasedChannel;
  buffer: RollingBuffer;
  timeline: EventTimeline;
  selfDeaf?: boolean;
}): Promise<VoiceSession> {
  const { channel, buffer, timeline } = args;
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guildId,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: args.selfDeaf ?? false, // must be false to receive audio
    selfMute: true,
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  log.info({ channel: channel.id }, "voice connection ready");

  const receiver = connection.receiver;

  receiver.speaking.on("start", (userId: string) => {
    const member = channel.guild.members.cache.get(userId) as GuildMember | undefined;
    const username = member?.displayName ?? `User-${userId.slice(-4)}`;
    const avatarUrl =
      member?.user.displayAvatarURL({ size: 128, extension: "png" }) ?? "";

    buffer.ensureUser({ userId, username, avatarUrl });
    timeline.pushVoice({ userId, kind: "speaking_start" });

    const opusStream = receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: 200 },
    });
    const decoder = new prism.opus.Decoder({
      frameSize: 960,
      channels: 2,
      rate: 48_000,
    });

    opusStream.pipe(decoder);

    decoder.on("data", (pcm: Buffer) => {
      buffer.writePcm(userId, pcm, Date.now());
    });
    decoder.on("end", () => {
      timeline.pushVoice({ userId, kind: "speaking_stop" });
    });
    decoder.on("error", (err) => {
      log.warn({ err, userId }, "decoder error");
    });
    opusStream.on("error", (err) => {
      log.warn({ err, userId }, "opus stream error");
    });
  });

  const cleanup = (): void => {
    try {
      receiver.speaking.removeAllListeners("start");
      connection.destroy();
    } catch {
      /* ignore */
    }
  };

  return { channel, connection, buffer, timeline, cleanup };
}
