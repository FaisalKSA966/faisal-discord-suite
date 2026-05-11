import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { SlashCommand } from "../client.js";
import { recordingManager } from "../modules/recorder/state.js";
import { errorEmbed, successEmbed } from "../ui/embeds.js";

export const clipCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("clip")
    .setDescription("احفظ Clip من آخر فترة (الافتراضي 5 دقايق)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages.toString())
    .setDMPermission(false)
    .addIntegerOption((o) =>
      o
        .setName("minutes")
        .setDescription("عدد الدقايق (1-60)")
        .setMinValue(1)
        .setMaxValue(60)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const minutes = interaction.options.getInteger("minutes") ?? 5;
    const session = recordingManager.get(interaction.guild.id);
    if (!session) {
      await interaction.reply({
        embeds: [errorEmbed("ابدأ التسجيل أولاً (`/record start`).")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.reply({
      embeds: [successEmbed(`جاري تجهيز Clip لآخر ${minutes} دقيقة — استخدم زر Clip من اللوحة لإصدار رسمي مع ثريد ✨`)],
      flags: MessageFlags.Ephemeral,
    });
    // Note: For a clean implementation, button paths produce the thread + render.
  },
};
