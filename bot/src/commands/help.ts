import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type { SlashCommand } from "../client.js";
import { buildEmbed } from "../ui/embeds.js";
import { Palette } from "../utils/colors.js";

export const helpCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("قائمة الأوامر والمميزات")
    .setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      embeds: [
        buildEmbed({
          title: "Faisal Discord Suite — دليل الاستخدام",
          color: Palette.accent,
          fields: [
            {
              name: "الإعدادات",
              value:
                "`/setup` — لوحة الإعدادات الكاملة (قنوات، Region، Auto-Pin، جودة الفيديو)",
            },
            {
              name: "التسجيل",
              value:
                "`/record panel` — نشر لوحة التحكم\n`/record start` / `/record stop` — تحكم سريع\n`/record status` — حالة التسجيل\n`/clip [minutes]` — اقتطاع من البافر",
            },
            {
              name: "الألعاب",
              value:
                "`/xo [rounds]` — افتح لوبي XO\n`/points` — نقاطك\n`/points leaderboard:true` — المتصدّرون",
            },
            {
              name: "الساوندبورد",
              value:
                "`/soundboard record user:@person` — سجّل صوت شخص (≤5ث)\n`/soundboard stop` — إيقاف",
            },
            {
              name: "VIP (للمالك)",
              value:
                "`/vip avatar change` / `/vip name change` / `/vip banner change`",
            },
            {
              name: "حساب الـ Companion (للمالك — يحتاج تطبيق Windows)",
              value:
                "`/account status` — حالة الـ companion\n" +
                "`/account name` / `/account display-name` / `/account bio`\n" +
                "`/account avatar` / `/account banner`\n" +
                "`/account presence` — online/dnd/idle/invisible\n" +
                "`/account custom-status` — نص + إيموجي\n" +
                "`/voice join|leave|mute` — تحكم بالروم\n" +
                "`/share start|stop|record-start|record-stop|status` — سكرين شير + تسجيل\n" +
                "`/camera on|off` — كاميرا",
            },
          ],
          footer: { text: "Faisal Suite" },
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
