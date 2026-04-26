"use client";

import { get, set, del, keys } from "idb-keyval";
import type { ArticleBody, Highlight, LibraryItem, PdfBody, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const ITEM_PREFIX = "item:";
const ARTICLE_PREFIX = "article:";
const PDF_PREFIX = "pdf:";
const HIGHLIGHT_PREFIX = "hl:";
const SETTINGS_KEY = "settings";

export async function listItems(): Promise<LibraryItem[]> {
  const all = await keys();
  const out: LibraryItem[] = [];
  for (const k of all) {
    if (typeof k === "string" && k.startsWith(ITEM_PREFIX)) {
      const v = await get<LibraryItem>(k);
      if (v) out.push(v);
    }
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getItem(id: string): Promise<LibraryItem | undefined> {
  return get<LibraryItem>(ITEM_PREFIX + id);
}

export async function saveItem(item: LibraryItem): Promise<void> {
  await set(ITEM_PREFIX + item.id, item);
}

export async function deleteItem(id: string): Promise<void> {
  await del(ITEM_PREFIX + id);
  await del(ARTICLE_PREFIX + id);
  await del(PDF_PREFIX + id);
  const all = await keys();
  for (const k of all) {
    if (typeof k === "string" && k.startsWith(HIGHLIGHT_PREFIX + id + ":")) {
      await del(k);
    }
  }
}

export async function getArticleBody(id: string): Promise<ArticleBody | undefined> {
  return get<ArticleBody>(ARTICLE_PREFIX + id);
}

export async function saveArticleBody(body: ArticleBody): Promise<void> {
  await set(ARTICLE_PREFIX + body.itemId, body);
}

export async function getPdfBody(id: string): Promise<PdfBody | undefined> {
  return get<PdfBody>(PDF_PREFIX + id);
}

export async function savePdfBody(body: PdfBody): Promise<void> {
  await set(PDF_PREFIX + body.itemId, body);
}

export async function listHighlights(itemId?: string): Promise<Highlight[]> {
  const all = await keys();
  const out: Highlight[] = [];
  for (const k of all) {
    if (typeof k !== "string" || !k.startsWith(HIGHLIGHT_PREFIX)) continue;
    if (itemId && !k.startsWith(HIGHLIGHT_PREFIX + itemId + ":")) continue;
    const v = await get<Highlight>(k);
    if (v) out.push(v);
  }
  return out.sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveHighlight(h: Highlight): Promise<void> {
  await set(HIGHLIGHT_PREFIX + h.itemId + ":" + h.id, h);
}

export async function deleteHighlight(itemId: string, id: string): Promise<void> {
  await del(HIGHLIGHT_PREFIX + itemId + ":" + id);
}

export async function getSettings(): Promise<Settings> {
  const v = await get<Settings>(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(v ?? {}) };
}

export async function saveSettings(s: Settings): Promise<void> {
  await set(SETTINGS_KEY, s);
}
