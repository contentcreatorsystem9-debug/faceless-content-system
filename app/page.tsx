import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

// Temporary home page. The real one-page landing site is built in Phase 9.
export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<HomeLanding />}>
      <HomeWithAuthRedirect searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeWithAuthRedirect({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  // Backward-compatible guard: some already-issued Supabase links may still
  // redirect to the site root. Forward their one-time code to the real
  // callback instead of rendering the landing page and losing the session.
  const params = await searchParams;
  const code = first(params.code);
  const tokenHash = first(params.token_hash);
  const type = first(params.type);
  if (code || tokenHash) {
    const callback = new URLSearchParams();
    if (code) callback.set("code", code);
    if (tokenHash) callback.set("token_hash", tokenHash);
    if (type) callback.set("type", type);
    callback.set("next", "/admin");
    redirect(`/auth/callback?${callback.toString()}`);
  }

  return <HomeLanding />;
}

function HomeLanding() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Post every week without filming every week.
      </h1>
      <p className="text-muted-foreground max-w-md">
        Record one clip. Approve your plan. Get finished reels every week.
      </p>
      <Link href="/login" className={buttonVariants({ size: "lg" })}>
        Log in
      </Link>
    </main>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
