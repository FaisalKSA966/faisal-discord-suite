import {
  MessageFlags,
  type Interaction,
  type ButtonInteraction,
  type ChannelSelectMenuInteraction,
  type StringSelectMenuInteraction,
} from "discord.js";
import { parseId } from "../../utils/ids.js";
import { getGuildSettings, updateGuildSettings } from "../../db/settings.js";
import { renderSetupPanel } from "./panel.js";
import { logger } from "../../utils/logger.js";
import { errorEmbed } from "../../ui/embeds.js";

const log = logger.child({ mod: "setup-router" });

export async function setupRouter(interaction: Interaction): Promise<void> {
  if (!interaction.inGuild() || !interaction.guild) {
    if (interaction.isRepliable()) {
      await interaction.reply({
        embeds: [errorEmbed("الإعدادات داخل السيرفر فقط.")],
        flags: MessageFlags.Ephemeral,
      });
    }
    return;
  }
  const { action } = parseId("customId" in interaction ? interaction.customId : "");

  try {
    switch (action) {
      case "rec_channel":
        await handleChannel(interaction as ChannelSelectMenuInteraction, "record_channel_id");
        break;
      case "pin_channel":
        await handleChannel(interaction as ChannelSelectMenuInteraction, "pin_channel_id");
        break;
      case "default_duration":
        await handleString(
          interaction as StringSelectMenuInteraction,
          (val) => updateGuildSettings(interaction.guildId!, {
            default_duration_minutes: parseInt(val, 10),
          })
        );
        break;
      case "region":
        await handleString(
          interaction as StringSelectMenuInteraction,
          (val) =>
            updateGuildSettings(interaction.guildId!, {
              target_region: val === "automatic" ? null : val,
            })
        );
        break;
      case "toggle_pin":
        await toggleField(interaction as ButtonInteraction, "auto_pin");
        break;
      case "toggle_region":
        await toggleField(interaction as ButtonInteraction, "auto_region");
        break;
      case "close":
        if (interaction.isButton()) {
          await interaction.update({
            embeds: [],
            content: "أُغلق ✅",
            components: [],
          });
        }
        break;
      default:
        log.warn({ action }, "unknown setup action");
    }
  } catch (err) {
    log.error({ err }, "setup router error");
  }
}

async function handleChannel(
  interaction: ChannelSelectMenuInteraction,
  field: "record_channel_id" | "pin_channel_id"
): Promise<void> {
  const id = interaction.values[0] ?? null;
  updateGuildSettings(interaction.guildId!, { [field]: id });
  const panel = await renderSetupPanel(interaction.guild!);
  await interaction.update(panel);
}

async function handleString(
  interaction: StringSelectMenuInteraction,
  apply: (val: string) => void
): Promise<void> {
  apply(interaction.values[0]!);
  const panel = await renderSetupPanel(interaction.guild!);
  await interaction.update(panel);
}

async function toggleField(
  interaction: ButtonInteraction,
  field: "auto_pin" | "auto_region"
): Promise<void> {
  const cur = getGuildSettings(interaction.guildId!);
  updateGuildSettings(interaction.guildId!, { [field]: cur[field] ? 0 : 1 });
  const panel = await renderSetupPanel(interaction.guild!);
  await interaction.update(panel);
}
