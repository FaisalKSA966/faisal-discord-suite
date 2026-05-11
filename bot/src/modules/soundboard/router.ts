import fs from "node:fs";
import path from "node:path";
import {
  AttachmentBuilder,
  MessageFlags,
  type ButtonInteraction,
  type Interaction,
  type ModalSubmitInteraction,
} from "discord.js";
import { parseId } from "../../utils/ids.js";
import {
  startSoundboardCapture,
  stopSoundboardCapture,
} from "./recorder.js";
import { db } from "../../db/database.js";
import {
  soundboardNameModal,
  soundboardPreviewPanel,
} from "../../ui/components.js";
import { errorEmbed, successEmbed } from "../../ui/embeds.js";
import { logger } from "../../utils/logger.js";

const log = logger.child({ mod: "sb-router" });

export async function soundboardRouter(interaction: Interaction): Promise<void> {
  const id = "customId" in interaction ? interaction.customId : "";
  const { action, args } = parseId(id);
  switch (action) {
    case "stop":
      if (interaction.isButton()) return handleStop(interaction);
      return;
    case "save":
      if (interaction.isButton()) return handleSavePrompt(interaction, args[0]!);
      return;
    case "discard":
      if (interaction.isButton()) return handleDiscard(interaction, args[0]!);
      return;
    case "modal":
      if (interaction.isModalSubmit()) return handleModal(interaction, args[0]!);
      return;
    default:
      log.warn({ action }, "unknown soundboard action");
  }
}

async function handleStop(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild) return;
  await interaction.deferUpdate();
  const res = await stopSoundboardCapture(interaction.guild.id);
  if (!res) {
    await interaction.followUp({
      embeds: [errorEmbed("ما فيه تسجيل ساوندبورد شغّال.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  db()
    .prepare(
      `INSERT INTO soundboard_drafts (id, guild_id, author_id, file_path, duration_ms)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(res.id, interaction.guild.id, interaction.user.id, res.mp3Path, res.durationMs);

  await interaction.message.edit({
    embeds: [successEmbed(`جاهز للمعاينة (${(res.durationMs / 1000).toFixed(2)}ث).`)],
    components: [soundboardPreviewPanel(res.id)],
    files: [new AttachmentBuilder(res.mp3Path).setName("preview.mp3")],
  });
}

async function handleSavePrompt(
  interaction: ButtonInteraction,
  draftId: string
): Promise<void> {
  await interaction.showModal(soundboardNameModal(draftId));
}

async function handleDiscard(
  interaction: ButtonInteraction,
  draftId: string
): Promise<void> {
  db().prepare(`DELETE FROM soundboard_drafts WHERE id = ?`).run(draftId);
  await interaction.update({
    embeds: [successEmbed("تم الإلغاء.")],
    components: [],
    files: [],
  });
}

async function handleModal(
  interaction: ModalSubmitInteraction,
  draftId: string
): Promise<void> {
  if (!interaction.guild) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const draft = db()
    .prepare(`SELECT * FROM soundboard_drafts WHERE id = ?`)
    .get(draftId) as { file_path: string; duration_ms: number } | undefined;
  if (!draft) {
    await interaction.editReply({
      embeds: [errorEmbed("الدرافت محذوف.")],
    });
    return;
  }
  const name = interaction.fields.getTextInputValue("sb_name").trim();
  const emoji = interaction.fields.getTextInputValue("sb_emoji").trim() || null;

  try {
    const file = fs.readFileSync(draft.file_path);
    // discord.js v14.16+ has SoundboardManager
    // Use REST endpoint to upload soundboard sound
    const base64 = `data:audio/mp3;base64,${file.toString("base64")}`;
    await interaction.client.rest.post(
      `/guilds/${interaction.guild.id}/soundboard-sounds` as `/${string}`,
      {
        body: {
          name,
          sound: base64,
          emoji_name: emoji,
          volume: 1,
        },
      }
    );
    db().prepare(`DELETE FROM soundboard_drafts WHERE id = ?`).run(draftId);
    await interaction.editReply({
      embeds: [successEmbed(`أُضيف "${name}" إلى ساوندبورد السيرفر.`)],
    });
  } catch (err) {
    log.error({ err }, "soundboard upload failed");
    await interaction.editReply({
      embeds: [
        errorEmbed(
          "فشل رفع الساوند. تأكد من صلاحية Manage Guild Expressions و حدّ الساوندبوردات في السيرفر."
        ),
      ],
    });
  }
  void path; // keep import for builds when used elsewhere
}
