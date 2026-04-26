import { Reader } from "@/components/Reader";

export const dynamic = "force-static";

export default function ReadPage({ params }: { params: { id: string } }) {
  return <Reader id={params.id} />;
}
