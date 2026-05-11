import {
  type Interaction,
  MessageFlags,
} from "discord.js";
import { logger } from "../utils/logger.js";
import { L } from "../utils/locale.js";
import { parseId } from "../utils/ids.js";

import { setupRouter } from "../modules/settings/router.js";
import { recordRouter } from "../modules/recorder/router.js";
import { xoRouter } from "../modules/xo/router.js";
import { soundboardRouter } from "../modules/soundboard/router.js";
import { editorRouter } from "../modules/recorder/editorRouter.js";

export async function onInteractionCreate(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = interaction.client.commands.get(interaction.commandName);
      if (!cmd) return;
      await cmd.execute(interaction);
      return;
    }

    if (
      interaction.isButton() ||
      interaction.isStringSelectMenu() ||
      interaction.isChannelSelectMenu() ||
      interaction.isUserSelectMenu() ||
      interaction.isRoleSelectMenu() ||
      interaction.isModalSubmit()
    ) {
      const id = "customId" in interaction ? interaction.customId : "";
      const { ns } = parseId(id);
      switch (ns) {
        case "setup":
          return setupRouter(interaction);
        case "rec":
          return recordRouter(interaction);
        case "edit":
          return editorRouter(interaction);
        case "xo":
          return xoRouter(interaction);
        case "sb":
          return soundboardRouter(interaction);
        default:
          logger.debug({ id }, "unmatched interaction");
          return;
      }
    }
  } catch (err) {
    logger.error({ err }, "interaction error");
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: L.unknownError, flags: MessageFlags.Ephemeral });
      } catch {
        /* ignore */
      }
    }
  }
}
