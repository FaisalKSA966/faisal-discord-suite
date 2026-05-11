import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import type { SlashCommand } from "../client.js";
import { getLeaderboard, getUserPoints } from "../db/points.js";
import { buildEmbed } from "../ui/embeds.js";
import { Palette } from "../utils/colors.js";

export const pointsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("points")
    .setDescription("عرض نقاطك في XO")
    .setDMPermission(false)
    .addUserOption((o) => o.setName("user").setDescription("شخص معين"))
    .addBooleanOption((o) =>
      o.setName("leaderboard").setDescription("عرض المتصدّرين")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const leaderboard = interaction.options.getBoolean("leaderboard") ?? false;
    if (leaderboard) {
      const rows = getLeaderboard(interaction.guild.id, 10);
      const lines = await Promise.all(
        rows.map(async (r, i) => {
          const m = await interaction.guild!.members.fetch(r.user_id).catch(() => null);
          const name = m?.displayName ?? `<@${r.user_id}>`;
          return `**${i + 1}.** ${name} — ${r.round_wins} جولة (${r.match_wins} مباراة)`;
        })
      );
      await interaction.reply({
        embeds: [
          buildEmbed({
            title: "متصدّري XO",
            description: lines.length > 0 ? lines.join("\n") : "ما فيه نقاط بعد.",
            color: Palette.accent,
          }),
        ],
      });
      return;
    }

    const target = interaction.options.getUser("user") ?? interaction.user;
    const p = getUserPoints(interaction.guild.id, target.id);
    await interaction.reply({
      embeds: [
        buildEmbed({
          title: `نقاط ${target.username}`,
          thumbnail: target.displayAvatarURL({ size: 128, extension: "png" }),
          description: [
            `**جولات فائزة:** ${p.round_wins}`,
            `**مباريات فائزة:** ${p.match_wins}`,
            `**تعادلات:** ${p.draws}`,
            `**خسائر:** ${p.losses}`,
          ].join("\n"),
          color: Palette.accent,
        }),
      ],
    });
  },
};
