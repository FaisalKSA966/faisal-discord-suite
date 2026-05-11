import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Snowflake,
} from "discord.js";
import { IDS } from "../../utils/ids.js";

export interface Lobby {
  id: string; // same as game id when started
  guildId: string;
  channelId: string;
  totalRounds: number;
  hostId: Snowflake;
  joiners: Snowflake[]; // ordered
  startedAt: number;
}

const lobbies = new Map<string, Lobby>();

export function createLobby(args: {
  id: string;
  guildId: string;
  channelId: string;
  hostId: string;
  totalRounds: number;
}): Lobby {
  const l: Lobby = {
    id: args.id,
    guildId: args.guildId,
    channelId: args.channelId,
    hostId: args.hostId,
    totalRounds: args.totalRounds,
    joiners: [args.hostId],
    startedAt: Date.now(),
  };
  lobbies.set(l.id, l);
  return l;
}

export function getLobby(id: string): Lobby | undefined {
  return lobbies.get(id);
}

export function destroyLobby(id: string): void {
  lobbies.delete(id);
}

export function joinLobby(id: string, userId: string): Lobby | null {
  const l = lobbies.get(id);
  if (!l) return null;
  if (l.joiners.includes(userId)) return l;
  l.joiners.push(userId);
  return l;
}

export function lobbyRow(id: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${IDS.xo.join}:${id}`)
      .setStyle(ButtonStyle.Success)
      .setLabel("انضمام")
      .setEmoji("🎮"),
    new ButtonBuilder()
      .setCustomId(`${IDS.xo.cancel}:${id}`)
      .setStyle(ButtonStyle.Danger)
      .setLabel("إلغاء")
  );
}
