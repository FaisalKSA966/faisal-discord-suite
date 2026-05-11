export interface VoiceEvent {
  ts: number; // ms since session start
  userId: string;
  kind:
    | "speaking_start"
    | "speaking_stop"
    | "camera_on"
    | "camera_off"
    | "share_start"
    | "share_stop"
    | "self_mute"
    | "self_unmute"
    | "self_deaf"
    | "self_undeaf"
    | "server_mute"
    | "server_unmute"
    | "joined"
    | "left"
    | "soundboard";
  meta?: Record<string, unknown>;
}

export interface ChatMsg {
  ts: number; // ms since session start
  userId: string;
  username: string;
  avatarUrl: string;
  content: string;
}

export interface PerUserAudio {
  userId: string;
  username: string;
  avatarUrl: string;
  pcmFile: string; // raw 48kHz s16le stereo PCM file path
  bytesWritten: number;
}

export interface SessionInfo {
  id: string;
  guildId: string;
  channelId: string;
  startedAt: number; // wall-clock ms
  startedBy: string;
  bufferMinutes: number;
}

export type EditOptions = {
  trimStartSec?: number;
  trimEndSec?: number;
  perUser?: Record<string, { mute?: boolean; volume?: number }>;
  shareVolume?: number;
};
