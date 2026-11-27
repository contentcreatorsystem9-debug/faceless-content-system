"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BrandListItem } from "@/lib/brands";

export function ClientSwitcher({ clients, selectedId }: { clients: Pick<BrandListItem, "id" | "name" | "niche">[]; selectedId: string }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? clients.filter((client) => client.name.toLowerCase().includes(needle)) : clients;
  }, [clients, query]);

  return (
    <details className="relative min-w-64">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 truncate">Client: {clients.find((client) => client.id === selectedId)?.name ?? "Choose client"}</span>
        <span aria-hidden className="text-muted-foreground">⌄</span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-full min-w-72 rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg">
        <label className="sr-only" htmlFor="client-search">Search clients</label>
        <input
          id="client-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search client..."
          className="mb-2 h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground px-2 py-3 text-sm">No client found.</p>
          ) : (
            filtered.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className={client.id === selectedId ? "bg-muted block rounded-md px-2 py-2 text-sm font-medium" : "hover:bg-muted block rounded-md px-2 py-2 text-sm"}
              >
                {client.name}
                {client.niche ? <span className="text-muted-foreground ml-2 text-xs">{client.niche}</span> : null}
              </Link>
            ))
          )}
        </div>
      </div>
    </details>
  );
}
