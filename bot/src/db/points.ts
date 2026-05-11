import { db } from "./database.js";

export interface PointRow {
  guild_id: string;
  user_id: string;
  round_wins: number;
  match_wins: number;
  draws: number;
  losses: number;
}

export function ensureRow(guildId: string, userId: string): PointRow {
  db()
    .prepare(
      `INSERT OR IGNORE INTO xo_points (guild_id, user_id) VALUES (?, ?)`
    )
    .run(guildId, userId);
  return db()
    .prepare(
      `SELECT * FROM xo_points WHERE guild_id = ? AND user_id = ?`
    )
    .get(guildId, userId) as PointRow;
}

export function addRoundWin(guildId: string, userId: string): void {
  ensureRow(guildId, userId);
  db()
    .prepare(
      `UPDATE xo_points SET round_wins = round_wins + 1, updated_at = strftime('%s','now')
       WHERE guild_id = ? AND user_id = ?`
    )
    .run(guildId, userId);
}

export function addMatchWin(guildId: string, userId: string): void {
  ensureRow(guildId, userId);
  db()
    .prepare(
      `UPDATE xo_points SET match_wins = match_wins + 1, updated_at = strftime('%s','now')
       WHERE guild_id = ? AND user_id = ?`
    )
    .run(guildId, userId);
}

export function addDraw(guildId: string, userIds: string[]): void {
  for (const uid of userIds) {
    ensureRow(guildId, uid);
    db()
      .prepare(
        `UPDATE xo_points SET draws = draws + 1, updated_at = strftime('%s','now')
         WHERE guild_id = ? AND user_id = ?`
      )
      .run(guildId, uid);
  }
}

export function addLoss(guildId: string, userId: string): void {
  ensureRow(guildId, userId);
  db()
    .prepare(
      `UPDATE xo_points SET losses = losses + 1, updated_at = strftime('%s','now')
       WHERE guild_id = ? AND user_id = ?`
    )
    .run(guildId, userId);
}

export function getUserPoints(guildId: string, userId: string): PointRow {
  return ensureRow(guildId, userId);
}

export function getLeaderboard(
  guildId: string,
  limit = 10
): PointRow[] {
  return db()
    .prepare(
      `SELECT * FROM xo_points WHERE guild_id = ?
       ORDER BY round_wins DESC, match_wins DESC, draws DESC
       LIMIT ?`
    )
    .all(guildId, limit) as PointRow[];
}
