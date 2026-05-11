// Liquid Glass — light, modern palette.
// Used for embeds, canvas backgrounds, button colors.

export const Palette = {
  // Embeds (Discord requires integer color)
  primary: 0xa3b8cc,
  accent: 0x6f8cad,
  success: 0x6fbf73,
  warn: 0xf4c95d,
  danger: 0xe07a7a,
  neutral: 0x9aa6b2,

  // Hex strings for canvas
  bg: "#f4f6fb",
  bgSoft: "#eef1f7",
  glass: "rgba(255, 255, 255, 0.55)",
  glassEdge: "rgba(255, 255, 255, 0.8)",
  glassShadow: "rgba(60, 80, 120, 0.18)",
  text: "#1a2230",
  textSoft: "#465064",
  textMuted: "#7a8294",
  blueX: "#3b7ddd",
  redO: "#d94646",
  winLine: "rgba(73, 122, 196, 0.85)",
  speaking: "#7bd389",
  cameraOn: "#69b1ff",
  shareOn: "#a07bff",
  muted: "#c75151",
} as const;
