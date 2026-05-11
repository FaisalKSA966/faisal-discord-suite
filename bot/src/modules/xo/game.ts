import { randomUUID } from "node:crypto";

export type Symbol = "X" | "O";

export interface Player {
  userId: string;
  name: string;
  avatarUrl?: string;
}

export interface Game {
  id: string;
  guildId: string;
  channelId: string;
  totalRounds: number;
  currentRound: number;
  playerX: Player;
  playerO: Player;
  cells: (Symbol | null)[];
  turn: Symbol;
  scores: { X: number; O: number; draws: number };
  status: "waiting" | "active" | "finished";
  winLine?: [number, number, number] | null;
  lastWinner?: Symbol | "draw" | null;
}

const LINES: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const games = new Map<string, Game>();

export function createGame(args: {
  guildId: string;
  channelId: string;
  playerX: Player;
  playerO: Player;
  totalRounds?: number;
}): Game {
  const g: Game = {
    id: randomUUID(),
    guildId: args.guildId,
    channelId: args.channelId,
    totalRounds: args.totalRounds ?? 3,
    currentRound: 1,
    playerX: args.playerX,
    playerO: args.playerO,
    cells: new Array(9).fill(null),
    turn: "X",
    scores: { X: 0, O: 0, draws: 0 },
    status: "active",
    winLine: null,
    lastWinner: null,
  };
  games.set(g.id, g);
  return g;
}

export function getGame(id: string): Game | undefined {
  return games.get(id);
}

export function makeMove(
  id: string,
  userId: string,
  cellIndex: number
): { ok: boolean; reason?: string; game: Game | null } {
  const g = games.get(id);
  if (!g) return { ok: false, reason: "اللعبة غير موجودة.", game: null };
  if (g.status !== "active") return { ok: false, reason: "اللعبة منتهية.", game: g };
  if (cellIndex < 0 || cellIndex > 8) return { ok: false, reason: "خانة غير صالحة.", game: g };
  if (g.cells[cellIndex] !== null) return { ok: false, reason: "الخانة مشغولة.", game: g };
  const expectedUser = g.turn === "X" ? g.playerX.userId : g.playerO.userId;
  if (userId !== expectedUser) return { ok: false, reason: "مو دورك.", game: g };

  g.cells[cellIndex] = g.turn;

  const winLine = findWinLine(g.cells, g.turn);
  if (winLine) {
    g.winLine = winLine;
    g.scores[g.turn] += 1;
    g.lastWinner = g.turn;
    finishRound(g);
  } else if (g.cells.every((c) => c !== null)) {
    g.scores.draws += 1;
    g.lastWinner = "draw";
    finishRound(g);
  } else {
    g.turn = g.turn === "X" ? "O" : "X";
  }

  return { ok: true, game: g };
}

function finishRound(g: Game): void {
  if (g.currentRound >= g.totalRounds) {
    g.status = "finished";
    return;
  }
  g.currentRound += 1;
  g.cells = new Array(9).fill(null);
  g.turn = g.lastWinner === "X" || g.lastWinner === "draw" ? "O" : "X";
  g.winLine = null;
}

export function matchWinner(g: Game): Symbol | "draw" | null {
  if (g.status !== "finished") return null;
  if (g.scores.X > g.scores.O) return "X";
  if (g.scores.O > g.scores.X) return "O";
  return "draw";
}

function findWinLine(cells: (Symbol | null)[], sym: Symbol): [number, number, number] | null {
  for (const line of LINES) {
    if (cells[line[0]] === sym && cells[line[1]] === sym && cells[line[2]] === sym) return line;
  }
  return null;
}
