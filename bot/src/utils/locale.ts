// Saudi-flavored Arabic strings used across the bot UI.
// Keep messages short, warm, and consistent.

export const L = {
  brand: "Faisal Suite",
  ok: "تم ✅",
  fail: "فشل ❌",
  loading: "جارٍ التنفيذ…",
  unknownError: "صار خطأ غير متوقع، جرّب مرة ثانية لو سمحت.",
  notInVoice: "لازم تكون داخل روم صوتي أول.",
  noPermission: "ما تقدر تستخدم هذا الأمر — صلاحيات ناقصة.",
  guildOnly: "هذا الأمر للاستخدام داخل السيرفر فقط.",
  ownerOnly: "هذا الأمر مخصص لمالك البوت فقط.",
  recording: "التسجيل شغّال…",
  notRecording: "ما فيه تسجيل شغّال حالياً.",
  alreadyRecording: "في تسجيل شغّال فعلاً.",
  saved: "تم الحفظ.",
  pinned: "البوت ثبّت نفسه في الروم.",
  unpinned: "البوت ما عاد مثبّت.",
  durationOptions: {
    "5": "آخر 5 دقايق",
    "10": "آخر 10 دقايق",
    "30": "آخر 30 دقيقة",
  } as Record<string, string>,
  formatDuration(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  },
  arabicNumber(n: number): string {
    // Optional: keep ASCII digits for readability of timestamps
    return n.toString();
  },
} as const;
