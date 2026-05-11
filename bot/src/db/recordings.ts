import { db } from "./database.js";
import { randomUUID } from "node:crypto";

export interface RecordingRow {
  id: string;
  guild_id: string;
  channel_id: string;
  started_by: string;
  started_at: number;
  stopped_at: number | null;
  thread_id: string | null;
  file_path: string | null;
  duration_seconds: number | null;
  kind: "full" | "clip";
  note: string | null;
}

export function createRecording(args: {
  guildId: string;
  channelId: string;
  startedBy: string;
  kind?: "full" | "clip";
  note?: string;
}): RecordingRow {
  const id = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  db()
    .prepare(
      `INSERT INTO recordings (id, guild_id, channel_id, started_by, started_at, kind, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      args.guildId,
      args.channelId,
      args.startedBy,
      now,
      args.kind ?? "full",
      args.note ?? null
    );
  return db()
    .prepare(`SELECT * FROM recordings WHERE id = ?`)
    .get(id) as RecordingRow;
}

export function updateRecording(
  id: string,
  patch: Partial<Omit<RecordingRow, "id">>
): RecordingRow | null {
  const keys = Object.keys(patch) as (keyof typeof patch)[];
  if (keys.length === 0) {
    return db()
      .prepare(`SELECT * FROM recordings WHERE id = ?`)
      .get(id) as RecordingRow | null;
  }
  const setClause = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => patch[k] ?? null);
  db()
    .prepare(`UPDATE recordings SET ${setClause} WHERE id = ?`)
    .run(...values, id);
  return db()
    .prepare(`SELECT * FROM recordings WHERE id = ?`)
    .get(id) as RecordingRow | null;
}
