import { WebSocket, WebSocketServer } from "ws";
import { cfg } from "./config.js";
import { logger } from "./logger.js";
import { startCapture, stopCapture, isCapturing } from "./recorder.js";

const log = logger.child({ mod: "bridge" });

interface Msg {
  type: string;
  authToken?: string;
  label?: string;
}

/**
 * Both server (so the bot can reach us) and client (so we can reach the bot,
 * if BOT_WS_URL is set). Keeps it simple.
 */
export function startBridge(): void {
  const wss = new WebSocketServer({ port: cfg.LISTEN_PORT });
  log.info({ port: cfg.LISTEN_PORT }, "companion ws server listening");
  wss.on("connection", (ws) => {
    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString()) as Msg;
        if (msg.authToken !== cfg.BOT_AUTH_TOKEN) {
          ws.send(JSON.stringify({ type: "error", error: "bad auth" }));
          return;
        }
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", capturing: isCapturing() }));
        } else if (msg.type === "start") {
          const r = startCapture(msg.label ?? "rec");
          ws.send(JSON.stringify({ type: "started", outFile: r.outFile }));
        } else if (msg.type === "stop") {
          const r = await stopCapture();
          ws.send(JSON.stringify({ type: "stopped", result: r }));
        }
      } catch (err) {
        log.warn({ err }, "ws msg error");
      }
    });
  });

  // Optional outbound client to the bot
  if (cfg.BOT_WS_URL) {
    try {
      const client = new WebSocket(cfg.BOT_WS_URL);
      client.on("open", () =>
        client.send(JSON.stringify({ type: "hello", authToken: cfg.BOT_AUTH_TOKEN }))
      );
      client.on("error", (err) => log.debug({ err }, "outbound ws error"));
    } catch (err) {
      log.debug({ err }, "outbound ws init failed");
    }
  }
}
