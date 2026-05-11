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
    description:
      "اضبط القنوات و الـ Region و الـ Buffer من القوائم والأزرار في الأسفل ↓\n" +
      "كل تغيير يُحفظ تلقائياً.",
    color: Palette.accent,
    fields: [
      {
        name: "📺 القنوات",
        value: [
          `قناة لوحة التسجيل: ${rec}`,
          `روم التثبيت 24/7: ${pin}`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "🌍 Region",
        value: `الافتراضي: \`${region}\`\nAuto-Region: ${
          s.auto_region ? "مفعّل ✅" : "مغلق ⚪"
        }`,
        inline: true,
      },
      {
        name: "📌 التثبيت",
        value: `Auto-Pin: ${s.auto_pin ? "مفعّل ✅" : "مغلق ⚪"}`,
        inline: true,
      },
      {
        name: "🎞️ الـ Clip / Buffer",
        value: [
          `Clip افتراضي: **${s.default_duration_minutes}** دقيقة`,
          `Buffer كبير: **${s.max_buffer_minutes}** دقيقة`,
          `جودة الرندر: **${s.render_quality}**`,
        ].join("\n"),
        inline: false,
      },
    ],
    footer: { text: "Faisal Suite • Liquid Glass Edition" },
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
