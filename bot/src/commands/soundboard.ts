import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type { SlashCommand } from "../client.js";
import { startSoundboardCapture, stopSoundboardCapture } from "../modules/soundboard/recorder.js";
import { errorEmbed, successEmbed } from "../ui/embeds.js";
import { soundboardRecordingPanel } from "../ui/components.js";

export const soundboardCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("soundboard")
    .setDescription("تسجيل ساوند جديد (5 ثوانٍ كحد أقصى)")
    .setDMPermission(false)
    .addSubcommand((s) =>
      s
        .setName("record")
        .setDescription("ابدأ تسجيل ساوند من شخص في الفويس")
        .addUserOption((o) =>
          o.setName("user").setDescription("الشخص المراد تسجيله").setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("stop").setDescription("إيقاف تسجيل الساوند الحالي")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand(true);
    if (sub === "record") {
      const target = interaction.options.getUser("user", true);
      const member = await interaction.guild.members.fetch(target.id);
      const channel = member.voice.channel;
      if (!channel) {
        await interaction.reply({
          embeds: [errorEmbed("الشخص مو موجود في روم صوتي.")],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      try {
        await startSoundboardCapture({
          channel,
          authorId: interaction.user.id,
          targetUserId: target.id,
        });
        await interaction.reply({
          embeds: [
            successEmbed(
              `بدأ تسجيل ${target.username} لمدة أقصاها 5 ثواني. اضغط إيقاف للحفظ والمعاينة.`
            ),
          ],
          components: [soundboardRecordingPanel()],
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
        await interaction.reply({
          embeds: [errorEmbed(msg)],
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }
    if (sub === "stop") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const res = await stopSoundboardCapture(interaction.guild.id);
      if (!res) {
        await interaction.editReply({ embeds: [errorEmbed("ما فيه تسجيل شغّال.")] });
        return;
      }
      await interaction.editReply({
        embeds: [successEmbed(`جاهز للمعاينة (${(res.durationMs / 1000).toFixed(2)}ث).`)],
      });
      return;
    }
  },
};
