import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { SlashCommand } from "../client.js";
import { recordingManager } from "../modules/recorder/state.js";
import { recordPanelRow } from "../ui/components.js";
import { buildEmbed, errorEmbed, successEmbed } from "../ui/embeds.js";
import { getGuildSettings } from "../db/settings.js";
import { Palette } from "../utils/colors.js";

export const recordCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("record")
    .setDescription("إدارة التسجيل الصوتي")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages.toString())
    .setDMPermission(false)
    .addSubcommand((s) =>
      s.setName("panel").setDescription("نشر لوحة التحكم في القناة الحالية")
    )
    .addSubcommand((s) => s.setName("start").setDescription("بدء التسجيل"))
    .addSubcommand((s) => s.setName("stop").setDescription("إيقاف التسجيل"))
    .addSubcommand((s) =>
      s
        .setName("status")
        .setDescription("عرض حالة التسجيل الحالية")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand(true);
    const settings = getGuildSettings(interaction.guild.id);

    if (sub === "panel") {
      const isRec = recordingManager.isActive(interaction.guild.id);
      await interaction.reply({
        embeds: [
          buildEmbed({
            title: "لوحة التسجيل",
            description: [
              `**القناة الافتراضية:** ${settings.pin_channel_id ? `<#${settings.pin_channel_id}>` : "غير محدد"}`,
              `**المدة الافتراضية:** ${settings.default_duration_minutes} دقيقة`,
              `**Buffer:** ${settings.max_buffer_minutes} دقيقة`,
              `**جودة الفيديو:** ${settings.render_quality}`,
            ].join("\n"),
            color: Palette.accent,
          }),
        ],
        components: [recordPanelRow(isRec)],
      });
      return;
    }

    if (sub === "status") {
      const s = recordingManager.get(interaction.guild.id);
      if (!s) {
        await interaction.reply({
          embeds: [buildEmbed({ description: "ما فيه تسجيل شغّال." })],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const secs = Math.floor((Date.now() - s.startedAt) / 1000);
      await interaction.reply({
        embeds: [
          buildEmbed({
            title: "حالة التسجيل",
            description: [
              `**الروم:** <#${s.channelId}>`,
              `**المدة:** ${formatDuration(secs)}`,
              `**عدد المشاركين:** ${s.buffer.listUsers().length}`,
              `**بدأ بواسطة:** <@${s.startedBy}>`,
            ].join("\n"),
            color: Palette.accent,
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === "start") {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const channel = member.voice.channel ??
        (settings.pin_channel_id
          ? interaction.guild.channels.cache.get(settings.pin_channel_id)
          : null);
      if (!channel || !channel.isVoiceBased()) {
        await interaction.reply({
          embeds: [errorEmbed("لازم تكون داخل روم صوتي، أو حدد روم تثبيت من /setup.")],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await recordingManager.start({
          channel,
          startedBy: interaction.user.id,
        });
        await interaction.editReply({
          embeds: [successEmbed(`بدأت التسجيل في <#${channel.id}>.`)],
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
        await interaction.editReply({ embeds: [errorEmbed(msg)] });
      }
      return;
    }

    if (sub === "stop") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const stopped = await recordingManager.stop(interaction.guild.id);
      if (!stopped) {
        await interaction.editReply({ embeds: [errorEmbed("ما فيه تسجيل شغّال.")] });
        return;
      }
      await interaction.editReply({
        embeds: [
          successEmbed(
            `تم إيقاف التسجيل. استخدم لوحة التسجيل لإرسال Clip أو نسخة كاملة في ثريد.`
          ),
        ],
      });
      return;
    }
  },
};

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
