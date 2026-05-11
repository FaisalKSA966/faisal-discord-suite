import type { Guild } from "discord.js";
import { getGuildSettings } from "../../db/settings.js";
import { buildEmbed } from "../../ui/embeds.js";
import { setupPanelRows } from "../../ui/components.js";
import { Palette } from "../../utils/colors.js";

export async function renderSetupPanel(guild: Guild) {
  const s = getGuildSettings(guild.id);
  const rec = s.record_channel_id ? `<#${s.record_channel_id}>` : "غير محدد";
  const pin = s.pin_channel_id ? `<#${s.pin_channel_id}>` : "غير محدد";
  const region = s.target_region ?? "Automatic";

  const embed = buildEmbed({
    title: `⚙️ إعدادات ${guild.name}`,
    description: [
      `**قناة لوحة التسجيل (ثريدات الفيديو):** ${rec}`,
      `**روم التثبيت 24/7:** ${pin}`,
      `**Region افتراضي:** \`${region}\``,
      `**المدة الافتراضية للـ Clip:** ${s.default_duration_minutes} دقيقة`,
      `**Buffer الكبير:** ${s.max_buffer_minutes} دقيقة`,
      `**جودة التركيب:** ${s.render_quality}`,
      `**Auto-Pin:** ${s.auto_pin ? "مفعّل ✅" : "مغلق"}`,
      `**Auto-Region:** ${s.auto_region ? "مفعّل ✅" : "مغلق"}`,
    ].join("\n"),
    color: Palette.accent,
    footer: { text: "غيّر القيم باستخدام القوائم والأزرار تحت ↓" },
  });

  return {
    embeds: [embed],
    components: setupPanelRows({
      recordChannelId: s.record_channel_id,
      pinChannelId: s.pin_channel_id,
      defaultDurationMinutes: s.default_duration_minutes,
      targetRegion: s.target_region,
      autoPin: !!s.auto_pin,
      autoRegion: !!s.auto_region,
    }),
  };
}
