import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="inline-block mb-10">
          <span className="font-serif text-[22px] font-semibold tracking-tight">Verso</span>
        </Link>
        <h1 className="font-serif text-[28px] font-semibold tracking-tight mb-2">
          Sign in to Verso
        </h1>
        <p className="muted text-[13.5px] mb-7">
          Your highlights and library will follow you across devices.
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p className="muted text-[11.5px] mt-8 leading-relaxed">
          By signing in, you agree to keep things calm. We don&rsquo;t sell your data.
          Your reads and highlights are yours.
        </p>
      </div>
    </div>
  );
}
