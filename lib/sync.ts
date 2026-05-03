"use client";

/**
 * Sync layer.
 *
 * Behavior:
 * - IDB stays the local read cache (so reads are instant, including
 *   offline). All UI reads from `storage.ts`.
 * - When a user is signed in, every write also goes to Supabase via this
 *   module. On boot we pull the server state into IDB.
 * - When the user is anonymous, we behave exactly like V1 (IDB only).
 * - First-sign-in migration uploads any local-only items + highlights so
 *   nothing the user already saved is lost.
 */

import type {
  ArticleBody,
  Highlight,
  LibraryItem,
  Settings,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import * as L from "./storage";
import { getSupabaseBrowser } from "./supabase/client";
import type {
  ArticleRow,
  HighlightRow,
  ItemRow,
  UserSettingsRow,
} from "./supabase/types";

// ---------- session helper ----------------------------------------

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  // getSession() reads from local storage and doesn't take the
  // navigator lock — safe to call repeatedly during normal writes.
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

// ---------- row <-> domain mappers --------------------------------

function rowToItem(r: ItemRow): LibraryItem {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    byline: r.byline ?? undefined,
    siteName: r.site_name ?? undefined,
    url: r.url ?? undefined,
    excerpt: r.excerpt ?? undefined,
    thumb: r.thumb ?? undefined,
    wordCount: r.word_count ?? undefined,
    readMinutes: r.read_minutes ?? undefined,
    archived: r.archived,
    bookmarked: r.bookmarked,
    progress: r.progress,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function itemToRow(i: LibraryItem, userId: string): ItemRow {
  return {
    id: i.id,
    user_id: userId,
    kind: i.kind,
    title: i.title,
    byline: i.byline ?? null,
    site_name: i.siteName ?? null,
    url: i.url ?? null,
    excerpt: i.excerpt ?? null,
    thumb: i.thumb ?? null,
    word_count: i.wordCount ?? null,
    read_minutes: i.readMinutes ?? null,
    archived: i.archived ?? false,
    bookmarked: i.bookmarked ?? false,
    progress: i.progress ?? 0,
    created_at: i.createdAt,
    updated_at: i.updatedAt,
  };
}

function rowToHighlight(r: HighlightRow): Highlight {
  return {
    id: r.id,
    itemId: r.item_id,
    color: r.color,
    text: r.text,
    prefix: r.prefix,
    suffix: r.suffix,
    page: r.page ?? undefined,
    note: r.note ?? undefined,
    createdAt: r.created_at,
  };
}

function highlightToRow(h: Highlight, userId: string): HighlightRow {
  return {
    id: h.id,
    item_id: h.itemId,
    user_id: userId,
    color: h.color,
    text: h.text,
    prefix: h.prefix,
    suffix: h.suffix,
    page: h.page ?? null,
    note: h.note ?? null,
    created_at: h.createdAt,
  };
}

function rowToSettings(r: UserSettingsRow): Settings {
  return {
    theme: r.theme as Settings["theme"],
    fontMode: r.font_mode as Settings["fontMode"],
    fontSize: r.font_size,
    lineHeight: r.line_height,
    columnWidth: r.column_width,
  };
}

// ---------- writes (mirror to server) -----------------------------

export async function saveItem(item: LibraryItem): Promise<void> {
  await L.saveItem(item);
  const userId = await getCurrentUserId();
  if (!userId) return;
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("items")
    .upsert(itemToRow(item, userId));
  if (error) console.warn("[sync] saveItem", error.message);
}

export async function deleteItem(id: string): Promise<void> {
  await L.deleteItem(id);
  const userId = await getCurrentUserId();
  if (!userId) return;
  const supabase = getSupabaseBrowser();
  // Cascading FKs handle articles/highlights/pdfs server-side.
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) console.warn("[sync] deleteItem", error.message);
}

export async function saveArticleBody(body: ArticleBody): Promise<void> {
  await L.saveArticleBody(body);
  const userId = await getCurrentUserId();
  if (!userId) return;
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("articles").upsert({
    item_id: body.itemId,
    user_id: userId,
    html: body.html,
    text_length: body.textLength,
  });
  if (error) console.warn("[sync] saveArticleBody", error.message);
}

export async function saveHighlight(h: Highlight): Promise<void> {
  await L.saveHighlight(h);
  const userId = await getCurrentUserId();
  if (!userId) return;
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("highlights")
    .upsert(highlightToRow(h, userId));
  if (error) console.warn("[sync] saveHighlight", error.message);
}

export async function deleteHighlight(itemId: string, id: string): Promise<void> {
  await L.deleteHighlight(itemId, id);
  const userId = await getCurrentUserId();
  if (!userId) return;
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("highlights").delete().eq("id", id);
  if (error) console.warn("[sync] deleteHighlight", error.message);
}

export async function saveSettings(s: Settings): Promise<void> {
  await L.saveSettings(s);
  const userId = await getCurrentUserId();
  if (!userId) return;
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    theme: s.theme,
    font_mode: s.fontMode,
    font_size: s.fontSize,
    line_height: s.lineHeight,
    column_width: s.columnWidth,
    updated_at: Date.now(),
  });
  if (error) console.warn("[sync] saveSettings", error.message);
}

// ---------- pulls (server -> IDB) ---------------------------------

/**
 * Hydrate IDB from server state. Called on app boot when a user is
 * signed in. Does not delete IDB rows that aren't on the server — those
 * are handled by the migration step.
 */
export async function pullAll(userId: string): Promise<void> {
  const supabase = getSupabaseBrowser();

  const [itemsRes, articlesRes, highlightsRes, settingsRes] = await Promise.all([
    supabase.from("items").select("*").eq("user_id", userId),
    supabase.from("articles").select("*").eq("user_id", userId),
    supabase.from("highlights").select("*").eq("user_id", userId),
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (itemsRes.error) {
    console.warn("[sync] pull items", itemsRes.error.message);
  } else if (itemsRes.data) {
    for (const r of itemsRes.data) {
      await L.saveItem(rowToItem(r));
    }
  }

  if (articlesRes.error) {
    console.warn("[sync] pull articles", articlesRes.error.message);
  } else if (articlesRes.data) {
    for (const r of articlesRes.data) {
      await L.saveArticleBody({
        itemId: r.item_id,
        html: r.html,
        textLength: r.text_length,
      });
    }
  }

  if (highlightsRes.error) {
    console.warn("[sync] pull highlights", highlightsRes.error.message);
  } else if (highlightsRes.data) {
    for (const r of highlightsRes.data) {
      await L.saveHighlight(rowToHighlight(r));
    }
  }

  if (settingsRes.error) {
    console.warn("[sync] pull settings", settingsRes.error.message);
  } else if (settingsRes.data) {
    await L.saveSettings(rowToSettings(settingsRes.data));
  } else {
    await L.saveSettings(DEFAULT_SETTINGS);
  }
}

// ---------- migration ---------------------------------------------

/**
 * On first sign-in, push any IDB-only items + their bodies + highlights
 * to the server. Idempotent: already-on-server rows are upserted
 * (last-write-wins by updated_at).
 */
export async function migrateLocalToServer(userId: string): Promise<{
  items: number; articles: number; highlights: number;
}> {
  const supabase = getSupabaseBrowser();
  const localItems = await L.listItems();
  const localHighlights = await L.listHighlights();

  let articleCount = 0;

  // Items
  if (localItems.length) {
    const rows = localItems.map((i) => itemToRow(i, userId));
    const { error } = await supabase.from("items").upsert(rows);
    if (error) console.warn("[migrate] items", error.message);
  }

  // Article bodies
  for (const i of localItems) {
    if (i.kind !== "article") continue;
    const body = await L.getArticleBody(i.id);
    if (!body) continue;
    const { error } = await supabase.from("articles").upsert({
      item_id: body.itemId,
      user_id: userId,
      html: body.html,
      text_length: body.textLength,
    });
    if (error) console.warn("[migrate] article", error.message);
    else articleCount++;
  }

  // Highlights
  if (localHighlights.length) {
    const rows = localHighlights.map((h) => highlightToRow(h, userId));
    const { error } = await supabase.from("highlights").upsert(rows);
    if (error) console.warn("[migrate] highlights", error.message);
  }

  return {
    items: localItems.length,
    articles: articleCount,
    highlights: localHighlights.length,
  };
}
