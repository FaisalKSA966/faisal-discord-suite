import {
  EmbedBuilder,
  type APIEmbedField,
  type EmbedAuthorData,
  type EmbedFooterData,
} from "discord.js";
import { Palette } from "../utils/colors.js";

export interface BasicEmbedArgs {
  title?: string;
  description?: string;
  color?: number;
  fields?: APIEmbedField[];
  thumbnail?: string;
  image?: string;
  author?: EmbedAuthorData;
  footer?: EmbedFooterData;
  url?: string;
  timestamp?: boolean;
}

export function buildEmbed(args: BasicEmbedArgs): EmbedBuilder {
  const e = new EmbedBuilder().setColor(args.color ?? Palette.primary);
  if (args.title) e.setTitle(args.title);
  if (args.description) e.setDescription(args.description);
  if (args.fields) e.addFields(args.fields);
  if (args.thumbnail) e.setThumbnail(args.thumbnail);
  if (args.image) e.setImage(args.image);
  if (args.author) e.setAuthor(args.author);
  if (args.footer) e.setFooter(args.footer);
  if (args.url) e.setURL(args.url);
  if (args.timestamp) e.setTimestamp(new Date());
  return e;
}

export function successEmbed(text: string, title = "تم"): EmbedBuilder {
  return buildEmbed({
    title,
    description: text,
    color: Palette.success,
  });
}

export function errorEmbed(text: string, title = "خطأ"): EmbedBuilder {
  return buildEmbed({
    title,
    description: text,
    color: Palette.danger,
  });
}

export function infoEmbed(text: string, title?: string): EmbedBuilder {
  return buildEmbed({
    title,
    description: text,
    color: Palette.accent,
  });
}
