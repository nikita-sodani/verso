export type ThemeId = "paper" | "night" | "ember";
export type FontMode = "editorial" | "modern" | "book";
export type HighlightColor = "key" | "insight" | "important" | "question";
export type ItemKind = "article" | "pdf";

export interface Highlight {
  id: string;
  itemId: string;
  color: HighlightColor;
  text: string;
  prefix: string;
  suffix: string;
  page?: number;
  createdAt: number;
  note?: string;
}

export interface LibraryItem {
  id: string;
  kind: ItemKind;
  title: string;
  byline?: string;
  siteName?: string;
  url?: string;
  excerpt?: string;
  thumb?: string;
  wordCount?: number;
  readMinutes?: number;
  createdAt: number;
  updatedAt: number;
  archived?: boolean;
  bookmarked?: boolean;
  progress?: number;
}

export interface ArticleBody {
  itemId: string;
  html: string;
  textLength: number;
}

export interface PdfBody {
  itemId: string;
  blob: Blob;
}

export interface Settings {
  theme: ThemeId;
  fontMode: FontMode;
  fontSize: number;
  lineHeight: number;
  columnWidth: number;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "paper",
  fontMode: "editorial",
  fontSize: 19,
  lineHeight: 1.7,
  columnWidth: 720,
};

export const HIGHLIGHT_META: Record<HighlightColor, { label: string; bg: string; bar: string }> = {
  key:       { label: "Key idea",  bg: "#FCE7B0", bar: "#E8C97A" },
  insight:   { label: "Insight",   bg: "#FBD9D2", bar: "#E59B9B" },
  important: { label: "Important", bg: "#D9E3F4", bar: "#9CB7DD" },
  question:  { label: "Question",  bg: "#DEEAD4", bar: "#B5D2A8" },
};
