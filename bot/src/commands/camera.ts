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

export const cameraCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("camera")
    .setDescription("شغّل / أوقف كاميرا حساب الـ Companion")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString())
    .setDMPermission(false)
    .addSubcommand((s) => s.setName("on").setDescription("شغّل الكاميرا"))
    .addSubcommand((s) => s.setName("off").setDescription("أوقف الكاميرا")),
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
      const r = await sendCompanion(sub === "on" ? "voice.camera.start" : "voice.camera.stop");
      await interaction.editReply({
        embeds: [
          r.ok
            ? successEmbed(sub === "on" ? "تم تشغيل الكاميرا." : "تم إيقاف الكاميرا.")
            : errorEmbed(r.error ?? "فشل التنفيذ — تأكد من اتصال الـ companion."),
        ],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
      await interaction.editReply({ embeds: [errorEmbed(msg)] });
    }
  },
};
