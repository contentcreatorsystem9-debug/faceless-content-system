import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerWorkspace } from "@/lib/customer-dashboard";

export const metadata: Metadata = { title: "Settings · Creator Tool" };

export default function SettingsPage() {
  return <Suspense fallback={<p className="text-muted-foreground text-sm">Loading settings…</p>}><SettingsContent /></Suspense>;
}

async function SettingsContent() {
  const { user, profile, brand, consent } = await getCustomerWorkspace();
  return <div className="space-y-6"><div><p className="text-muted-foreground text-sm">Your workspace preferences</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1></div><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Account</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><span className="text-muted-foreground">Email:</span> {user.email}</p><p><span className="text-muted-foreground">Plan:</span> {profile?.plan ?? "Not selected"}</p></CardContent></Card><Card><CardHeader><CardTitle>Brand</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><span className="text-muted-foreground">Name:</span> {brand?.name ?? "Being set up"}</p><p><span className="text-muted-foreground">Niche:</span> {brand?.niche ?? "—"}</p><p><span className="text-muted-foreground">Twin consent:</span> {consent?.admin_status === "approved" ? "Approved" : "Pending"}</p></CardContent></Card></div></div>;
}
