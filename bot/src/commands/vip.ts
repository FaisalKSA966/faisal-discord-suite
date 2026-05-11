import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { SlashCommand } from "../client.js";
import { errorEmbed, successEmbed } from "../ui/embeds.js";
import { env } from "../config/env.js";

export const vipCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("vip")
    .setDescription("أوامر VIP لتعديل بروفايل البوت")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString())
    .setDMPermission(false)
    .addSubcommandGroup((g) =>
      g
        .setName("avatar")
        .setDescription("تغيير صورة البوت")
        .addSubcommand((s) =>
          s
            .setName("change")
            .setDescription("غيّر صورة البوت العالمية")
            .addAttachmentOption((o) =>
              o.setName("image").setDescription("الصورة الجديدة").setRequired(true)
            )
        )
    )
    .addSubcommandGroup((g) =>
      g
        .setName("name")
        .setDescription("تغيير اسم البوت")
        .addSubcommand((s) =>
          s
            .setName("change")
            .setDescription("غيّر اسم البوت العالمي")
            .addStringOption((o) =>
              o.setName("value").setDescription("الاسم الجديد").setRequired(true)
            )
        )
    )
    .addSubcommandGroup((g) =>
      g
        .setName("banner")
        .setDescription("تغيير بنر البوت")
        .addSubcommand((s) =>
          s
            .setName("change")
            .setDescription("غيّر بنر البوت العالمي")
            .addAttachmentOption((o) =>
              o.setName("image").setDescription("البنر الجديد").setRequired(true)
            )
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (env.OWNER_ID && interaction.user.id !== env.OWNER_ID) {
      await interaction.reply({
        embeds: [errorEmbed("هذا الأمر لمالك البوت فقط.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const group = interaction.options.getSubcommandGroup(true);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      if (group === "avatar") {
        const att = interaction.options.getAttachment("image", true);
        const arr = await fetch(att.url).then((r) => r.arrayBuffer());
        await interaction.client.user!.setAvatar(Buffer.from(arr));
        await interaction.editReply({ embeds: [successEmbed("تم تحديث صورة البوت.")] });
      } else if (group === "name") {
        const v = interaction.options.getString("value", true);
        await interaction.client.user!.setUsername(v);
        await interaction.editReply({ embeds: [successEmbed(`تم تغيير الاسم إلى ${v}.`)] });
      } else if (group === "banner") {
        const att = interaction.options.getAttachment("image", true);
        const arr = await fetch(att.url).then((r) => r.arrayBuffer());
        await interaction.client.user!.setBanner(Buffer.from(arr));
        await interaction.editReply({ embeds: [successEmbed("تم تحديث البنر.")] });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
      await interaction.editReply({ embeds: [errorEmbed(msg)] });
    }
  },
};
