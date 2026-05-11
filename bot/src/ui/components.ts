import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { IDS } from "../utils/ids.js";

export function recordPanelRow(isRecording: boolean): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  if (isRecording) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(IDS.record.stop)
        .setStyle(ButtonStyle.Danger)
        .setLabel("إيقاف التسجيل")
        .setEmoji("⏹️"),
      new ButtonBuilder()
        .setCustomId(IDS.record.clip5)
        .setStyle(ButtonStyle.Primary)
        .setLabel("Clip آخر 5د")
        .setEmoji("✂️"),
      new ButtonBuilder()
        .setCustomId(IDS.record.clip10)
        .setStyle(ButtonStyle.Primary)
        .setLabel("Clip آخر 10د")
        .setEmoji("✂️"),
      new ButtonBuilder()
        .setCustomId(IDS.record.clip30)
        .setStyle(ButtonStyle.Primary)
        .setLabel("Clip آخر 30د")
        .setEmoji("✂️")
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(IDS.record.start)
        .setStyle(ButtonStyle.Success)
        .setLabel("بدء التسجيل")
        .setEmoji("⏺️"),
      new ButtonBuilder()
        .setCustomId(IDS.record.clip5)
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Clip آخر 5د")
        .setEmoji("✂️"),
      new ButtonBuilder()
        .setCustomId(IDS.record.openSettings)
        .setStyle(ButtonStyle.Secondary)
        .setLabel("الإعدادات")
        .setEmoji("⚙️")
    );
  }
  return row;
}

export function setupPanelRows(s: {
  recordChannelId: string | null;
  pinChannelId: string | null;
  defaultDurationMinutes: number;
  targetRegion: string | null;
  autoPin: boolean;
  autoRegion: boolean;
}): ActionRowBuilder<ChannelSelectMenuBuilder | StringSelectMenuBuilder | ButtonBuilder>[] {
  const recordRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(IDS.setup.selectRecordChannel)
      .setPlaceholder("اختر قناة لوحة التسجيل")
      .setChannelTypes(ChannelType.GuildText)
      .setMaxValues(1)
  );

  const pinRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(IDS.setup.selectPinChannel)
      .setPlaceholder("اختر روم صوتي للتثبيت 24/7")
      .setChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
      .setMaxValues(1)
  );

  const durationRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(IDS.setup.selectDefaultDuration)
      .setPlaceholder(`المدة الافتراضية للـ clip — حالياً ${s.defaultDurationMinutes} دقيقة`)
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel("5 دقايق").setValue("5"),
        new StringSelectMenuOptionBuilder().setLabel("10 دقايق").setValue("10"),
        new StringSelectMenuOptionBuilder().setLabel("30 دقيقة").setValue("30")
      )
  );

  const regionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(IDS.setup.selectRegion)
      .setPlaceholder(
        s.targetRegion ? `الـ Region الافتراضي: ${s.targetRegion}` : "اختر Region افتراضي"
      )
      .addOptions(
        regionOption("rotterdam"),
        regionOption("frankfurt"),
        regionOption("amsterdam"),
        regionOption("stockholm"),
        regionOption("london"),
        regionOption("us-east"),
        regionOption("us-central"),
        regionOption("us-west"),
        regionOption("us-south"),
        regionOption("dubai"),
        regionOption("india"),
        regionOption("singapore"),
        regionOption("japan"),
        regionOption("sydney"),
        regionOption("brazil"),
        regionOption("south-africa"),
        regionOption("automatic")
      )
  );

  const togglesRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.setup.toggleAutoPin)
      .setStyle(s.autoPin ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setLabel(`Auto-Pin: ${s.autoPin ? "مفعّل" : "مغلق"}`),
    new ButtonBuilder()
      .setCustomId(IDS.setup.toggleAutoRegion)
      .setStyle(s.autoRegion ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setLabel(`Auto-Region: ${s.autoRegion ? "مفعّل" : "مغلق"}`),
    new ButtonBuilder()
      .setCustomId(IDS.setup.close)
      .setStyle(ButtonStyle.Danger)
      .setLabel("إغلاق")
  );

  return [recordRow, pinRow, durationRow, regionRow, togglesRow];
}

function regionOption(value: string): StringSelectMenuOptionBuilder {
  return new StringSelectMenuOptionBuilder().setLabel(value).setValue(value);
}

export function soundboardRecordingPanel(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.soundboard.stop)
      .setStyle(ButtonStyle.Danger)
      .setLabel("إيقاف التسجيل")
      .setEmoji("⏹️")
  );
}

export function soundboardPreviewPanel(draftId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${IDS.soundboard.save}:${draftId}`)
      .setStyle(ButtonStyle.Success)
      .setLabel("اعتماد + إضافة"),
    new ButtonBuilder()
      .setCustomId(`${IDS.soundboard.discard}:${draftId}`)
      .setStyle(ButtonStyle.Danger)
      .setLabel("إلغاء")
  );
}

export function soundboardNameModal(draftId: string): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(`${IDS.soundboard.modal}:${draftId}`)
    .setTitle("معلومات الساوندبورد")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("sb_name")
          .setLabel("الاسم")
          .setStyle(TextInputStyle.Short)
          .setMinLength(2)
          .setMaxLength(32)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("sb_emoji")
          .setLabel("إيموجي (اختياري)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(8)
      )
    );
}

export function editorRow(_recordingId: string): ActionRowBuilder<ButtonBuilder>[] {
  void _recordingId;
  // Note: per-user toggles are added dynamically by the editor module.
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.editor.trimStart)
      .setStyle(ButtonStyle.Primary)
      .setLabel("قص من البداية"),
    new ButtonBuilder()
      .setCustomId(IDS.editor.trimEnd)
      .setStyle(ButtonStyle.Primary)
      .setLabel("قص من النهاية"),
    new ButtonBuilder()
      .setCustomId(IDS.editor.rename)
      .setStyle(ButtonStyle.Secondary)
      .setLabel("تغيير اسم الثريد"),
    new ButtonBuilder()
      .setCustomId(IDS.editor.render)
      .setStyle(ButtonStyle.Success)
      .setLabel("نسخة معدّلة")
  );
  return [row1];
}


