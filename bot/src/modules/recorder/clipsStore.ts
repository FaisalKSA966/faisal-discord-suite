import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { VoiceEvent, ChatMsg } from "./types.js";
import type { UserAudio } from "./renderer.js";

export interface ClipMetadata {
  id: string;
  guildId: string;
  channelId: string;
  threadId: string;
  startedBy: string;
  startedAtSession: number; // wall-clock ms when this clip's slice began
  durationSec: number;
  sliceDir: string;
  users: UserAudio[];
  events: VoiceEvent[];
  chat: ChatMsg[];
  // Persisted on disk for restart safety
}

const clips = new Map<string, ClipMetadata>();

export function saveClip(meta: Omit<ClipMetadata, "id"> & { id?: string }): ClipMetadata {
  const id = meta.id ?? randomUUID();
  const full: ClipMetadata = { ...meta, id };
  clips.set(id, full);
  try {
    fs.writeFileSync(
      path.join(meta.sliceDir, "meta.json"),
      JSON.stringify(full, null, 2)
    );
  } catch {
    /* ignore */
  }
  return full;
}

export function getClip(id: string): ClipMetadata | undefined {
  const inMem = clips.get(id);
  if (inMem) return inMem;
  return undefined;
}

export function loadClipFromDisk(sliceDir: string): ClipMetadata | null {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(sliceDir, "meta.json"), "utf-8")
    ) as ClipMetadata;
    clips.set(data.id, data);
    return data;
  } catch {
    return null;
  }
}

export function updateClip(id: string, patch: Partial<ClipMetadata>): ClipMetadata | null {
  const m = clips.get(id);
  if (!m) return null;
  const updated = { ...m, ...patch };
  clips.set(id, updated);
  try {
    fs.writeFileSync(
      path.join(m.sliceDir, "meta.json"),
      JSON.stringify(updated, null, 2)
    );
  } catch {
    /* ignore */
  }
  return updated;
}
