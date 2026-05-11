import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { cfg } from "./config.js";
import { logger } from "./logger.js";

const log = logger.child({ mod: "recorder" });

interface ActiveCapture {
  outFile: string;
  startedAt: number;
  ff: ChildProcess;
}

let active: ActiveCapture | null = null;

/**
 * Start an ffmpeg x11grab capture of the current X display.
 * Requires Xvfb / Xorg with DISPLAY set, and an audio source (pulseaudio).
 */
export function startCapture(label: string): { outFile: string } {
  if (active) throw new Error("capture already running");
  fs.mkdirSync(cfg.OUTPUT_DIR, { recursive: true });
  const outFile = path.join(
    cfg.OUTPUT_DIR,
    `${label}-${Date.now()}.mp4`
  );

  const display = process.env.DISPLAY ?? ":99";
  const args = [
    "-y",
    "-thread_queue_size", "1024",
    "-f", "x11grab",
    "-framerate", String(cfg.CAPTURE_FPS),
    "-video_size", `${cfg.CAPTURE_WIDTH}x${cfg.CAPTURE_HEIGHT}`,
    "-i", display,
    "-thread_queue_size", "1024",
    "-f", "pulse",
    "-ac", "2",
    "-i", "default",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    outFile,
  ];

  const ff = spawn("ffmpeg", args);
  ff.stderr.on("data", (d) => log.trace({ ff: d.toString() }, "ffmpeg"));
  ff.on("close", (code) => {
    log.info({ code, outFile }, "ffmpeg finished");
    active = null;
  });

  active = { outFile, startedAt: Date.now(), ff };
  log.info({ outFile }, "capture started");
  return { outFile };
}

export async function stopCapture(): Promise<{ outFile: string; durationMs: number } | null> {
  if (!active) return null;
  const a = active;
  try {
    a.ff.stdin?.write("q");
  } catch {
    /* ignore */
  }
  await new Promise<void>((resolve) => {
    a.ff.on("close", () => resolve());
    setTimeout(resolve, 5_000); // safety
  });
  return {
    outFile: a.outFile,
    durationMs: Date.now() - a.startedAt,
  };
}

export function isCapturing(): boolean {
  return active !== null;
}
