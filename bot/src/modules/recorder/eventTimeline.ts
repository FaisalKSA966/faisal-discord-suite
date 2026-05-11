import type { VoiceEvent, ChatMsg } from "./types.js";

/**
 * In-memory timeline of voice events (camera on/off, speaking, etc.) and chat messages.
 * All timestamps are in milliseconds relative to session start.
 *
 * Bounded to `maxAgeMs` to follow the rolling-buffer window.
 */
export class EventTimeline {
  private events: VoiceEvent[] = [];
  private chat: ChatMsg[] = [];
  private startedAt: number;
  private maxAgeMs: number;

  constructor(startedAt: number, bufferMinutes: number) {
    this.startedAt = startedAt;
    this.maxAgeMs = bufferMinutes * 60 * 1000;
  }

  pushVoice(ev: Omit<VoiceEvent, "ts"> & { ts?: number }): void {
    const ts = ev.ts ?? Date.now() - this.startedAt;
    this.events.push({ ...ev, ts });
    this.gc();
  }

  pushChat(msg: Omit<ChatMsg, "ts"> & { ts?: number }): void {
    const ts = msg.ts ?? Date.now() - this.startedAt;
    this.chat.push({ ...msg, ts });
    this.gc();
  }

  private gc(): void {
    const cutoff = Date.now() - this.startedAt - this.maxAgeMs;
    if (cutoff <= 0) return;
    while (this.events.length && this.events[0]!.ts < cutoff) this.events.shift();
    while (this.chat.length && this.chat[0]!.ts < cutoff) this.chat.shift();
  }

  /** Return events that fall within [sliceStartTs, sliceEndTs] relative to session start. */
  sliceEvents(sliceStartTs: number, sliceEndTs: number): VoiceEvent[] {
    return this.events
      .filter((e) => e.ts >= sliceStartTs && e.ts <= sliceEndTs)
      .map((e) => ({ ...e, ts: e.ts - sliceStartTs }));
  }

  sliceChat(sliceStartTs: number, sliceEndTs: number): ChatMsg[] {
    return this.chat
      .filter((m) => m.ts >= sliceStartTs && m.ts <= sliceEndTs)
      .map((m) => ({ ...m, ts: m.ts - sliceStartTs }));
  }
}
