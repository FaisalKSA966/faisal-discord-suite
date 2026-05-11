import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";
import { logger } from "../../utils/logger.js";

// Discord opus stream decodes to 48kHz stereo s16le by default.
// PCM bytes per second = 48000 * 2 channels * 2 bytes = 192,000 bytes/s.
export const SAMPLE_RATE = 48_000;
export const CHANNELS = 2;
export const BYTES_PER_SAMPLE = 2;
export const PCM_BYTES_PER_SECOND = SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE;

interface UserBufferState {
  userId: string;
  username: string;
  avatarUrl: string;
  filePath: string;
  fd: number;
  totalBytesWritten: number; // cumulative across whole session
  // Map of "absolute byte offset at start of write" -> nothing.
  // We track a sliding window by truncating from the front periodically.
  // For simplicity we keep a single file and a `bufferStartByte` cursor.
  // bufferStartByte = totalBytesWritten - bufferMaxBytes (clamped >= 0).
  // Periodically we rewrite the file to drop the discarded prefix.
  lastTrimAt: number;
}

const log = logger.child({ mod: "rolling" });

/**
 * Rolling PCM buffer manager.
 * One file per user. Maintains up to `bufferMaxSeconds` of audio per user.
 * Implementation: append-only file, periodic in-place trim to bound disk.
 */
export class RollingBuffer {
  private users: Map<string, UserBufferState> = new Map();
  private silenceFiller: NodeJS.Timeout | null = null;
  private startedAt: number;
  private bufferMaxBytes: number;
  private trimEveryMs = 60_000;
  private sessionDir: string;

  constructor(sessionDir: string, bufferMinutes: number) {
    this.sessionDir = sessionDir;
    this.bufferMaxBytes = bufferMinutes * 60 * PCM_BYTES_PER_SECOND;
    this.startedAt = Date.now();
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  start(): void {
    // Periodic trim
    this.silenceFiller = setInterval(() => this.trimAll(), this.trimEveryMs);
  }

  stop(): void {
    if (this.silenceFiller) clearInterval(this.silenceFiller);
    this.silenceFiller = null;
    for (const u of this.users.values()) {
      try {
        fs.closeSync(u.fd);
      } catch {
        /* ignore */
      }
    }
  }

  getStartedAt(): number {
    return this.startedAt;
  }

  ensureUser(args: {
    userId: string;
    username: string;
    avatarUrl: string;
  }): UserBufferState {
    let s = this.users.get(args.userId);
    if (s) return s;
    const filePath = path.join(this.sessionDir, `${args.userId}.pcm`);
    const fd = fs.openSync(filePath, "a+");
    s = {
      userId: args.userId,
      username: args.username,
      avatarUrl: args.avatarUrl,
      filePath,
      fd,
      totalBytesWritten: 0,
      lastTrimAt: Date.now(),
    };
    this.users.set(args.userId, s);
    log.debug({ user: args.userId }, "user buffer opened");
    return s;
  }

  /**
   * Write PCM bytes for a user at the current session-relative time.
   * Caller is responsible for padding silence between speech packets if needed;
   * we accept gaps and pad on slice. (See `slice`.)
   */
  writePcm(
    userId: string,
    pcm: Buffer,
    captureTsMs: number
  ): void {
    const s = this.users.get(userId);
    if (!s) return;
    const expectedOffsetBytes = Math.floor(
      ((captureTsMs - this.startedAt) / 1000) * PCM_BYTES_PER_SECOND
    );
    const currentEnd = s.totalBytesWritten;
    if (expectedOffsetBytes > currentEnd) {
      // Pad with silence (zeros). Be careful with very large gaps.
      const gap = Math.min(expectedOffsetBytes - currentEnd, PCM_BYTES_PER_SECOND * 5);
      if (gap > 0) {
        const silence = Buffer.alloc(gap);
        fs.writeSync(s.fd, silence);
        s.totalBytesWritten += gap;
      }
    }
    fs.writeSync(s.fd, pcm);
    s.totalBytesWritten += pcm.length;
  }

  /**
   * Trim files so they hold at most `bufferMaxBytes`.
   * Implementation: read tail into a temp file, rename over original.
   * Runs at most every `trimEveryMs`.
   */
  private trimAll(): void {
    for (const s of this.users.values()) {
      if (s.totalBytesWritten <= this.bufferMaxBytes) continue;
      try {
        const keep = this.bufferMaxBytes;
        const skip = s.totalBytesWritten - keep;
        const tmp = s.filePath + ".tmp";
        const out = fs.openSync(tmp, "w");
        const chunk = Buffer.alloc(1 << 20); // 1MB
        let pos = skip;
        while (pos < s.totalBytesWritten) {
          const n = fs.readSync(s.fd, chunk, 0, chunk.length, pos);
          if (n <= 0) break;
          fs.writeSync(out, chunk.subarray(0, n));
          pos += n;
        }
        fs.closeSync(out);
        fs.closeSync(s.fd);
        fs.renameSync(tmp, s.filePath);
        s.fd = fs.openSync(s.filePath, "a+");
        s.totalBytesWritten = keep;
        s.lastTrimAt = Date.now();
      } catch (err) {
        log.warn({ err, user: s.userId }, "trim failed");
      }
    }
  }

  /**
   * Slice the last `durationSec` seconds (relative to "now") for every user.
   * Returns an array of paths to per-user PCM slices (always equal length, padded with silence).
   * Caller is responsible for cleanup.
   */
  sliceLastSeconds(durationSec: number, outDir: string): {
    userId: string;
    username: string;
    avatarUrl: string;
    pcmFile: string;
    bytesWritten: number;
  }[] {
    fs.mkdirSync(outDir, { recursive: true });
    const wantedBytes = Math.min(
      durationSec * PCM_BYTES_PER_SECOND,
      this.bufferMaxBytes
    );
    const results: ReturnType<RollingBuffer["sliceLastSeconds"]> = [];

    // Determine session length for padding (to align all users to same length)
    let sessionLenBytes = 0;
    for (const s of this.users.values()) {
      sessionLenBytes = Math.max(sessionLenBytes, s.totalBytesWritten);
    }
    const sliceBytes = Math.min(wantedBytes, sessionLenBytes);

    for (const s of this.users.values()) {
      try {
        // Flush
        fs.fsyncSync(s.fd);
      } catch {
        /* ignore */
      }
      const outFile = path.join(outDir, `${s.userId}.pcm`);
      const out = fs.openSync(outFile, "w");
      const userEnd = s.totalBytesWritten;
      const userStart = Math.max(0, userEnd - sliceBytes);
      const leadingSilence = sliceBytes - (userEnd - userStart);
      if (leadingSilence > 0) {
        const silence = Buffer.alloc(leadingSilence);
        fs.writeSync(out, silence);
      }
      let pos = userStart;
      const chunk = Buffer.alloc(1 << 20);
      while (pos < userEnd) {
        const n = fs.readSync(s.fd, chunk, 0, chunk.length, pos);
        if (n <= 0) break;
        fs.writeSync(out, chunk.subarray(0, n));
        pos += n;
      }
      fs.closeSync(out);
      results.push({
        userId: s.userId,
        username: s.username,
        avatarUrl: s.avatarUrl,
        pcmFile: outFile,
        bytesWritten: sliceBytes,
      });
    }
    return results;
  }

  listUsers(): { userId: string; username: string; avatarUrl: string }[] {
    return [...this.users.values()].map((u) => ({
      userId: u.userId,
      username: u.username,
      avatarUrl: u.avatarUrl,
    }));
  }
}
