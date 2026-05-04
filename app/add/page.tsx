import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AddArticle } from "@/components/AddArticle";

export const dynamic = "force-dynamic";

function Fallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={28} className="animate-spin muted" />
    </div>
  );
}

export default function AddPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AddArticle />
    </Suspense>
  );
}
