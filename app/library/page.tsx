import { Suspense } from "react";
import { LibraryGrid } from "@/components/LibraryGrid";

export const dynamic = "force-static";

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-10 muted text-sm">Loading…</div>}>
      <LibraryGrid />
    </Suspense>
  );
}
