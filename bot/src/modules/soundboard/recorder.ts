import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import ffmpegPathModule from "ffmpeg-static";

const ffmpegPath = ffmpegPathModule as unknown as string | null;
import {
  EndBehaviorType,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} from "@discordjs/voice";
import prism from "prism-media";
import type { VoiceBasedChannel } from "discord.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const log = logger.child({ mod: "sb-recorder" });

interface ActiveRec {
  id: string;
  guildId: string;
  channelId: string;
  authorId: string;
  targetUserId: string;
  pcmPath: string;
  fd: number;
  startedAt: number;
  timeout: NodeJS.Timeout;
  bytesWritten: number;
  unsub: () => void;
}

const active = new Map<string, ActiveRec>(); // by guildId

const MAX_DURATION_MS = 5_200;
const PCM_BYTES_PER_MS = 192_000 / 1000;

export async function startSoundboardCapture(args: {
  channel: VoiceBasedChannel;
  authorId: string;
  targetUserId: string;
}): Promise<{ id: string }> {
  if (active.has(args.channel.guildId)) {
    throw new Error("في تسجيل ساوندبورد شغّال بالفعل.");
  }
  let conn = getVoiceConnection(args.channel.guildId);
  if (!conn) {
    conn = joinVoiceChannel({
      channelId: args.channel.id,
      guildId: args.channel.guildId,
      adapterCreator: args.channel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: true,
    });
    await entersState(conn, VoiceConnectionStatus.Ready, 15_000);
  }

  const id = randomUUID();
  const outDir = path.join(env.RECORDINGS_DIR, args.channel.guildId, "soundboard", id);
  fs.mkdirSync(outDir, { recursive: true });
  const pcmPath = path.join(outDir, "raw.pcm");
  const fd = fs.openSync(pcmPath, "w");

  const opusStream = conn.receiver.subscribe(args.targetUserId, {
    end: { behavior: EndBehaviorType.Manual },
  });
  const decoder = new prism.opus.Decoder({
    frameSize: 960,
    channels: 2,
    rate: 48_000,
  });
  opusStream.pipe(decoder);
  const rec: ActiveRec = {
    id,
    guildId: args.channel.guildId,
    channelId: args.channel.id,
    authorId: args.authorId,
    targetUserId: args.targetUserId,
    pcmPath,
    fd,
    startedAt: Date.now(),
    bytesWritten: 0,
    timeout: setTimeout(() => void stopSoundboardCapture(args.channel.guildId), MAX_DURATION_MS),
    unsub: () => {
      try {
        opusStream.destroy();
      } catch {
        /* ignore */
      }
    },
  };
  decoder.on("data", (buf: Buffer) => {
    if (rec.bytesWritten + buf.length > MAX_DURATION_MS * PCM_BYTES_PER_MS) return;
    fs.writeSync(fd, buf);
    rec.bytesWritten += buf.length;
  });
  decoder.on("error", (err) => log.warn({ err }, "decoder error"));
  active.set(args.channel.guildId, rec);
  log.info({ id, target: args.targetUserId }, "soundboard capture started");
  return { id };
}

export async function stopSoundboardCapture(
  guildId: string
): Promise<{ id: string; mp3Path: string; durationMs: number } | null> {
  const rec = active.get(guildId);
  if (!rec) return null;
  active.delete(guildId);
  clearTimeout(rec.timeout);
  rec.unsub();
  fs.closeSync(rec.fd);
  const durationMs = Math.min(MAX_DURATION_MS, Math.floor(rec.bytesWritten / PCM_BYTES_PER_MS));
  const mp3Path = rec.pcmPath.replace(/\.pcm$/, ".mp3");
  await pcmToMp3(rec.pcmPath, mp3Path);
  return { id: rec.id, mp3Path, durationMs };
}

export function getActive(guildId: string): ActiveRec | undefined {
  return active.get(guildId);
}

function pcmToMp3(pcm: string, mp3: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error("ffmpeg not available"));
    const ff = spawn(ffmpegPath, [
      "-y",
      "-f", "s16le",
      "-ar", "48000",
      "-ac", "2",
      "-i", pcm,
      "-codec:a", "libmp3lame",
      "-qscale:a", "4",
      mp3,
    ]);
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}`))));
    ff.on("error", reject);
  });
}
