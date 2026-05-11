import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const log = logger.child({ mod: "db" });

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(env.DATABASE_PATH), { recursive: true });
  _db = new Database(env.DATABASE_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  runMigrations(_db);
  log.info({ path: env.DATABASE_PATH }, "database ready");
  return _db;
}

const MIGRATIONS: { id: string; up: string }[] = [
  {
    id: "001_init",
    up: `
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        record_channel_id TEXT,
        pin_channel_id TEXT,
        default_duration_minutes INTEGER NOT NULL DEFAULT 5,
        target_region TEXT,
        auto_pin INTEGER NOT NULL DEFAULT 1,
        auto_region INTEGER NOT NULL DEFAULT 1,
        max_buffer_minutes INTEGER NOT NULL DEFAULT 30,
        render_quality TEXT NOT NULL DEFAULT 'medium',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS recordings (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        started_by TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        stopped_at INTEGER,
        thread_id TEXT,
        file_path TEXT,
        duration_seconds INTEGER,
        kind TEXT NOT NULL DEFAULT 'full', -- 'full' | 'clip'
        note TEXT
      );

      CREATE TABLE IF NOT EXISTS xo_points (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        round_wins INTEGER NOT NULL DEFAULT 0,
        match_wins INTEGER NOT NULL DEFAULT 0,
        draws INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
        PRIMARY KEY (guild_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS soundboard_drafts (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        target_user_id TEXT,
        file_path TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
      );
    `,
  },
];

function runMigrations(d: Database.Database): void {
  d.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );`);
  const applied = new Set<string>(
    d
      .prepare(`SELECT id FROM schema_migrations`)
      .all()
      .map((r) => (r as { id: string }).id)
  );
  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) continue;
    log.info({ id: m.id }, "applying migration");
    d.exec(m.up);
    d.prepare(`INSERT INTO schema_migrations (id) VALUES (?)`).run(m.id);
  }
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
