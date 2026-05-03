"use client";

import { getSupabaseBrowser } from "./supabase/client";
import { savePdfBody, getPdfBody } from "./storage";
import { getCurrentUserId } from "./sync";

const BUCKET = "pdfs";

function pathFor(userId: string, itemId: string) {
  // RLS policy requires the first folder segment to equal auth.uid().
  return `${userId}/${itemId}.pdf`;
}

/** Upload a PDF blob to Supabase Storage + register in `pdfs` table. */
export async function uploadPdf(itemId: string, file: Blob): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const supabase = getSupabaseBrowser();
  const path = pathFor(userId, itemId);
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: "application/pdf", upsert: true });
  if (upErr) {
    console.warn("[pdf] upload", upErr.message);
    return;
  }
  const { error: rowErr } = await supabase.from("pdfs").upsert({
    item_id: itemId,
    user_id: userId,
    storage_path: path,
    byte_size: file.size,
  });
  if (rowErr) console.warn("[pdf] register", rowErr.message);
}

/**
 * Resolve a usable Blob for a PDF: prefer the local IDB copy, otherwise
 * download from Supabase Storage and cache it locally for next time.
 */
export async function loadPdfBlob(itemId: string): Promise<Blob | null> {
  const local = await getPdfBody(itemId);
  if (local?.blob) return local.blob;

  const userId = await getCurrentUserId();
  if (!userId) return null;
  const supabase = getSupabaseBrowser();

  const { data: meta } = await supabase
    .from("pdfs")
    .select("storage_path")
    .eq("item_id", itemId)
    .maybeSingle();
  if (!meta?.storage_path) return null;

  const { data, error } = await supabase.storage.from(BUCKET).download(meta.storage_path);
  if (error || !data) {
    console.warn("[pdf] download", error?.message);
    return null;
  }
  await savePdfBody({ itemId, blob: data });
  return data;
}

/** Delete the storage object + row when an item is deleted server-side. */
export async function deletePdf(itemId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const supabase = getSupabaseBrowser();
  const path = pathFor(userId, itemId);
  await supabase.storage.from(BUCKET).remove([path]);
  // The pdfs row is deleted by FK cascade when items row goes.
}
