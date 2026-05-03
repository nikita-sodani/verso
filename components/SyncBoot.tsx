"use client";

import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { migrateLocalToServer, pullAll } from "@/lib/sync";
import * as L from "@/lib/storage";

const MIGRATE_FLAG_PREFIX = "verso:migrated:"; // + userId

/**
 * Mounted in the root layout. Watches auth state and:
 *
 * 1. On first SIGNED_IN for a given user, migrates any IDB-only items
 *    + highlights to the server, then pulls the canonical state back.
 * 2. On every SIGNED_IN after that, pulls server state into IDB.
 * 3. Subscribes to realtime changes on `items` and `highlights` so
 *    edits made on another device flow back into IDB while this tab is
 *    open. Notifies listeners via a custom `verso:sync` event so the
 *    library / reader can refresh.
 */
export function SyncBoot() {
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let cancelled = false;
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;
    let activeUserId: string | null = null;
    let booting = false;

    async function teardownChannel() {
      if (activeChannel) {
        const ch = activeChannel;
        activeChannel = null;
        try { await supabase.removeChannel(ch); } catch {}
      }
    }

    async function bootForUser(userId: string) {
      // De-dupe — the same userId might come from both the initial
      // getUser() resolution AND the SIGNED_IN auth event. React Strict
      // Mode also double-invokes effects. Guard with a "booting" flag
      // and an "activeUserId" so we only run once per user per mount.
      if (cancelled) return;
      if (activeUserId === userId && (activeChannel || booting)) return;
      if (booting) return;
      booting = true;

      try {
        await teardownChannel();
        activeUserId = userId;

        const flagKey = MIGRATE_FLAG_PREFIX + userId;
        const migrated =
          typeof localStorage !== "undefined" &&
          localStorage.getItem(flagKey) === "1";

        if (!migrated) {
          try {
            const stats = await migrateLocalToServer(userId);
            // eslint-disable-next-line no-console
            console.info("[verso] migrated to server", stats);
          } catch (e) {
            console.warn("[verso] migration failed", e);
          }
          try { localStorage.setItem(flagKey, "1"); } catch {}
        }

        try { await pullAll(userId); } catch (e) { console.warn("[verso] pull failed", e); }
        if (cancelled) return;
        window.dispatchEvent(new CustomEvent("verso:sync"));

        // Realtime — fresh channel each boot. Use a random suffix so
        // we never collide with a half-cleaned-up previous channel.
        const channelName = `verso-${userId}-${Math.random().toString(36).slice(2, 10)}`;
        const channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "items", filter: `user_id=eq.${userId}` },
            async (payload) => { await applyItemChange(payload); window.dispatchEvent(new CustomEvent("verso:sync")); },
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "highlights", filter: `user_id=eq.${userId}` },
            async (payload) => { await applyHighlightChange(payload); window.dispatchEvent(new CustomEvent("verso:sync")); },
          );
        channel.subscribe();
        activeChannel = channel;
      } finally {
        booting = false;
      }
    }

    // Initial check — getSession() reads from storage and avoids the
    // navigator lock contention that getUser() triggers when multiple
    // tabs are open.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const u = data.session?.user;
      if (u) void bootForUser(u.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        void bootForUser(session.user.id);
      } else if (event === "SIGNED_OUT") {
        activeUserId = null;
        void teardownChannel();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      void teardownChannel();
    };
  }, []);

  return null;
}

async function applyItemChange(payload: any) {
  const { eventType, new: newRow, old: oldRow } = payload;
  if (eventType === "DELETE" && oldRow?.id) {
    await L.deleteItem(oldRow.id);
    return;
  }
  if (newRow) {
    await L.saveItem({
      id: newRow.id,
      kind: newRow.kind,
      title: newRow.title,
      byline: newRow.byline ?? undefined,
      siteName: newRow.site_name ?? undefined,
      url: newRow.url ?? undefined,
      excerpt: newRow.excerpt ?? undefined,
      thumb: newRow.thumb ?? undefined,
      wordCount: newRow.word_count ?? undefined,
      readMinutes: newRow.read_minutes ?? undefined,
      archived: newRow.archived,
      bookmarked: newRow.bookmarked,
      progress: newRow.progress,
      createdAt: newRow.created_at,
      updatedAt: newRow.updated_at,
    });
  }
}

async function applyHighlightChange(payload: any) {
  const { eventType, new: newRow, old: oldRow } = payload;
  if (eventType === "DELETE" && oldRow?.id && oldRow?.item_id) {
    await L.deleteHighlight(oldRow.item_id, oldRow.id);
    return;
  }
  if (newRow) {
    await L.saveHighlight({
      id: newRow.id,
      itemId: newRow.item_id,
      color: newRow.color,
      text: newRow.text,
      prefix: newRow.prefix,
      suffix: newRow.suffix,
      page: newRow.page ?? undefined,
      note: newRow.note ?? undefined,
      createdAt: newRow.created_at,
    });
  }
}
