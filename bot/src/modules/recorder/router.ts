import {
  MessageFlags,
  ChannelType,
  type Interaction,
  type ButtonInteraction,
  type GuildMember,
  type VoiceBasedChannel,
} from "discord.js";
import path from "node:path";
import fs from "node:fs";
import { parseId } from "../../utils/ids.js";
import { L } from "../../utils/locale.js";
import { logger } from "../../utils/logger.js";
import { recordingManager } from "./state.js";
import { getGuildSettings } from "../../db/settings.js";
import { recordPanelRow } from "../../ui/components.js";
import { buildEmbed, errorEmbed, successEmbed } from "../../ui/embeds.js";
import { renderRecording } from "./renderer.js";
import { saveClip } from "./clipsStore.js";
import { editorPanel } from "./editorRouter.js";
import { Palette } from "../../utils/colors.js";

const log = logger.child({ mod: "rec-router" });

export async function recordRouter(interaction: Interaction): Promise<void> {
  if (!interaction.isButton() || !interaction.guild) return;
  const { action, args } = parseId(interaction.customId);
  switch (action) {
    case "start":
      return startBtn(interaction);
    case "stop":
      return stopBtn(interaction);
    case "clip":
      return clipBtn(interaction, parseInt(args[0] ?? "5", 10));
    case "open_settings":
      await interaction.reply({
        embeds: [buildEmbed({
          title: "الإعدادات",
          description: "استخدم الأمر `/setup` لفتح لوحة الإعدادات الكاملة.",
          color: Palette.accent,
        })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    default:
      log.warn({ action }, "unknown recorder action");
  }
}

async function startBtn(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild) return;
  const member = interaction.member as GuildMember | null;
  const channel = await resolveTargetChannel(interaction);
  if (!channel) {
    await interaction.reply({
      embeds: [errorEmbed("ما لقيت روم صوتي — حدد الروم من /setup أو ادخل أنت روم صوتي قبل ما تضغط.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await recordingManager.start({
      channel,
      startedBy: member?.id ?? interaction.user.id,
    });
    await interaction.editReply({
      embeds: [successEmbed(`بدأت التسجيل في <#${channel.id}>.`, "التسجيل شغّال")],
    });
    // Update the public control message if it exists
    try {
      await refreshPanelMessage(interaction);
    } catch {
      /* ignore */
    }
  } catch (err) {
    log.error({ err }, "start failed");
    const msg = err instanceof Error ? err.message : L.unknownError;
    await interaction.editReply({ embeds: [errorEmbed(msg)] });
  }
}

async function stopBtn(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const session = await recordingManager.stop(interaction.guild.id);
  if (!session) {
    await interaction.editReply({ embeds: [errorEmbed(L.notRecording)] });
    return;
  }
  await interaction.editReply({
    embeds: [successEmbed(`تم إيقاف التسجيل — المدة: ${L.formatDuration(Math.floor((Date.now() - session.startedAt) / 1000))}`)],
  });
  // Save full session as a clip equivalent for editing
  await finalizeAndPost(interaction, {
    sessionId: session.id,
    durationSec: Math.floor((Date.now() - session.startedAt) / 1000),
    sliceDir: session.sessionDir,
    title: `تسجيل ${new Date().toLocaleString("ar-SA")}`,
  });
  try {
    await refreshPanelMessage(interaction);
  } catch {
    /* ignore */
  }
}

async function clipBtn(interaction: ButtonInteraction, minutes: number): Promise<void> {
  if (!interaction.guild) return;
  const session = recordingManager.get(interaction.guild.id);
  if (!session) {
    await interaction.reply({
      embeds: [errorEmbed("ما فيه تسجيل شغّال — لازم تبدأ تسجيل عشان تقدر تأخذ Clip.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const durationSec = Math.max(5, Math.min(minutes * 60, session.bufferMinutes * 60));
  const outDir = path.join(session.sessionDir, "clips", `${Date.now()}`);
  fs.mkdirSync(outDir, { recursive: true });
  const users = session.buffer.sliceLastSeconds(durationSec, outDir);
  const events = session.timeline.sliceEvents(
    (Date.now() - session.startedAt) - durationSec * 1000,
    Date.now() - session.startedAt
  );
  const chat = session.timeline.sliceChat(
    (Date.now() - session.startedAt) - durationSec * 1000,
    Date.now() - session.startedAt
  );
  await interaction.editReply({
    embeds: [successEmbed(`جارٍ تجهيز Clip آخر ${minutes} دقيقة — يستغرق قليلاً…`)],
  });

  await finalizeAndPost(interaction, {
    sessionId: session.id,
    durationSec,
    sliceDir: outDir,
    title: `Clip — آخر ${minutes} دقيقة`,
    presliced: { users, events, chat },
  });
}

async function finalizeAndPost(
  interaction: ButtonInteraction,
  args: {
    sessionId: string;
    durationSec: number;
    sliceDir: string;
    title: string;
    presliced?: {
      users: { userId: string; username: string; avatarUrl: string; pcmFile: string; bytesWritten: number }[];
      events: import("./types.js").VoiceEvent[];
      chat: import("./types.js").ChatMsg[];
    };
  }
): Promise<void> {
  if (!interaction.guild) return;
  const settings = getGuildSettings(interaction.guild.id);

  let users: ReturnType<typeof saveClip>["users"];
  let events: import("./types.js").VoiceEvent[];
  let chat: import("./types.js").ChatMsg[];
  if (args.presliced) {
    users = args.presliced.users;
    events = args.presliced.events;
    chat = args.presliced.chat;
  } else {
    // Use entire buffer
    const session = recordingManager.get(interaction.guild.id);
    if (session) {
      users = session.buffer.sliceLastSeconds(args.durationSec, args.sliceDir);
      events = session.timeline.sliceEvents(0, args.durationSec * 1000);
      chat = session.timeline.sliceChat(0, args.durationSec * 1000);
    } else {
      users = [];
      events = [];
      chat = [];
    }
  }

  const outFile = path.join(args.sliceDir, "out.mp4");
  try {
    await renderRecording({
      outDir: args.sliceDir,
      outFile,
      durationSec: args.durationSec,
      users,
      events,
      chat,
      quality: settings.render_quality,
      title: args.title,
    });
  } catch (err) {
    log.error({ err }, "render error");
    await interaction.followUp({
      embeds: [errorEmbed("فشل تركيب الفيديو — راجع سجلات البوت.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Post in a private thread in the configured record channel
  const recChannelId = settings.record_channel_id ?? interaction.channelId;
  const channel = interaction.guild.channels.cache.get(recChannelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.followUp({
      embeds: [errorEmbed("ما لقيت قناة التسجيل — حدد قناة نصية من /setup.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const now = new Date();
  const dateLabel = now.toLocaleString("ar-SA", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const thread = await channel.threads.create({
    name: `🎙️ ${dateLabel}`,
    type: ChannelType.PrivateThread,
    invitable: true,
    reason: "Recording thread",
  });

  const clip = saveClip({
    guildId: interaction.guildId!,
    channelId: recChannelId,
    threadId: thread.id,
    startedBy: interaction.user.id,
    startedAtSession: Date.now() - args.durationSec * 1000,
    durationSec: args.durationSec,
    sliceDir: args.sliceDir,
    users,
    events,
    chat,
  });

  // Try to attach the file
  try {
    const stat = fs.statSync(outFile);
    // 25MB default upload limit; with boost up to 100MB
    const sizeMb = stat.size / (1024 * 1024);
    if (sizeMb < 24) {
      await thread.send({
        content: `<@${interaction.user.id}> 🎬 ${args.title} (${L.formatDuration(args.durationSec)})`,
        files: [outFile],
        embeds: [
          buildEmbed({
            title: args.title,
            description: `الأشخاص: ${users.length} • المدة: ${L.formatDuration(args.durationSec)}`,
            color: Palette.accent,
          }),
        ],
        components: editorPanel(clip.id),
      });
    } else {
      await thread.send({
        content: `<@${interaction.user.id}> 🎬 ${args.title} (${L.formatDuration(args.durationSec)})\n\n⚠️ حجم الفيديو ${sizeMb.toFixed(1)}MB أكبر من حد الرفع — ارفعه يدوياً من المسار:\n\`${outFile}\``,
        embeds: [
          buildEmbed({
            title: args.title,
            description: `الأشخاص: ${users.length} • المدة: ${L.formatDuration(args.durationSec)}`,
            color: Palette.warn,
          }),
        ],
        components: editorPanel(clip.id),
      });
    }
  } catch (err) {
    log.error({ err }, "post failed");
    await thread.send({
      embeds: [errorEmbed("صار خطأ في إرسال الفيديو، تحقق من السجلات.")],
    });
  }
}

async function resolveTargetChannel(
  interaction: ButtonInteraction
): Promise<VoiceBasedChannel | null> {
  if (!interaction.guild) return null;
  const settings = getGuildSettings(interaction.guild.id);
  if (settings.pin_channel_id) {
    const c = interaction.guild.channels.cache.get(settings.pin_channel_id);
    if (c && c.isVoiceBased()) return c;
  }
  const member = interaction.member as GuildMember | null;
  const vs = member?.voice;
  if (vs?.channel) return vs.channel;
  return null;
}

async function refreshPanelMessage(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.message) return;
  try {
    await interaction.message.edit({
      components: [recordPanelRow(recordingManager.isActive(interaction.guildId!))],
    });
  } catch {
    /* ignore */
  }
}
