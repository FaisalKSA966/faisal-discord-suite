import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { SlashCommand } from "../client.js";
import { errorEmbed, successEmbed } from "../ui/embeds.js";
import { env } from "../config/env.js";
import { sendCompanion } from "../modules/companion/client.js";

export const shareCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("share")
    .setDescription("تحكم بسكرين شير الـ Companion + التسجيل المحلي على Windows")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString())
    .setDMPermission(false)
    .addSubcommand((s) =>
      s.setName("start").setDescription("ابدأ سكرين شير من حساب الـ companion + سجّل الشاشة محلياً")
    )
    .addSubcommand((s) =>
      s.setName("stop").setDescription("أوقف السكرين شير + التسجيل")
    )
    .addSubcommand((s) =>
      s.setName("record-start").setDescription("ابدأ تسجيل الشاشة فقط (بدون شير في الروم)")
    )
    .addSubcommand((s) =>
      s.setName("record-stop").setDescription("أوقف تسجيل الشاشة")
    )
    .addSubcommand((s) => s.setName("status").setDescription("الحالة الحالية")),
  async execute(interaction: ChatInputCommandInteraction) {
    if (env.OWNER_ID && interaction.user.id !== env.OWNER_ID) {
      await interaction.reply({
        embeds: [errorEmbed("هذا الأمر لمالك البوت فقط.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const sub = interaction.options.getSubcommand(true);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      switch (sub) {
        case "start": {
          const a = await sendCompanion("voice.share.start");
          const b = await sendCompanion("capture.start", { label: "share" });
          if (!a.ok) {
            await interaction.editReply({
              embeds: [errorEmbed(`تعذّر بدء سكرين الشير: ${a.error ?? "unknown"}`)],
            });
            return;
          }
          await interaction.editReply({
            embeds: [
              successEmbed(
                b.ok
                  ? `بدأ سكرين شير + التسجيل المحلي.\nملف: \`${pretty(b.data)}\``
                  : `سكرين شير شغّال، لكن التسجيل المحلي فشل: ${b.error ?? ""}`
              ),
            ],
          });
          return;
        }
        case "stop": {
          const a = await sendCompanion("voice.share.stop");
          const b = await sendCompanion("capture.stop");
          await interaction.editReply({
            embeds: [
              successEmbed(
                `سكرين شير: ${a.ok ? "متوقف" : "فشل/لم يكن شغّال"}\nالتسجيل: ${
                  b.ok ? pretty(b.data) : "لم يكن شغّال"
                }`
              ),
            ],
          });
          return;
        }
        case "record-start": {
          const r = await sendCompanion("capture.start", { label: "record" });
          await interaction.editReply({
            embeds: [
              r.ok
                ? successEmbed(`بدأ التسجيل.\n\`${pretty(r.data)}\``)
                : errorEmbed(r.error ?? "فشل بدء التسجيل"),
            ],
          });
          return;
        }
        case "record-stop": {
          const r = await sendCompanion("capture.stop");
          await interaction.editReply({
            embeds: [
              r.ok ? successEmbed(`أوقف التسجيل.\n\`${pretty(r.data)}\``) : errorEmbed(r.error ?? "فشل"),
            ],
          });
          return;
        }
        case "status": {
          const r = await sendCompanion("capture.status");
          await interaction.editReply({
            embeds: [
              r.ok ? successEmbed(`الحالة: \`${pretty(r.data)}\``) : errorEmbed(r.error ?? "فشل"),
            ],
          });
          return;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
      await interaction.editReply({ embeds: [errorEmbed(msg)] });
    }
  },
};

function pretty(v: unknown): string {
  if (!v) return "—";
  return JSON.stringify(v).slice(0, 300);
}
