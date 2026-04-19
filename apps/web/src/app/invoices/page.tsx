"use client";

import { useOnboarding } from "@/hooks/useOnboarding";
import { formatDecimal } from "@/lib/formatAmount";
import { trpc } from "@/trpc/react";
import { skipToken } from "@tanstack/react-query";
import Link from "next/link";

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export default function InvoicesPage() {
  const { profile, isLoaded } = useOnboarding();
  const contractorId = profile?.id;

  const listQuery = trpc.invoices.listForContractor.useQuery(
    contractorId ? { contractorId } : skipToken,
  );
  const statsQuery = trpc.invoices.statsForContractor.useQuery(
    contractorId ? { contractorId } : skipToken,
  );

  if (!isLoaded) {
    return (
      <div className="flex h-64 max-w-5xl items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!contractorId) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-outline-variant/10 bg-surface-container-low p-10 text-center">
        <h1 className="font-headline text-2xl font-bold text-on-background">No contractor profile</h1>
        <p className="mt-2 text-sm text-zinc-400">Onboard first to see your invoices.</p>
        <Link href="/onboarding" className="mt-6 inline-block text-sm font-bold text-primary hover:underline">
          Go to onboarding
        </Link>
      </div>
    );
  }

  const invoices = listQuery.data?.invoices ?? [];
  const stats = statsQuery.data;

  return (
    <div className="flex max-w-5xl flex-col gap-12">
      <div className="space-y-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-background">Invoices</h1>
        <p className="text-sm text-zinc-400">
          Contractor invoices from the ledger database (scoped to your profile).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-outline-variant/5 bg-surface-container-low p-5">
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">Total outstanding</p>
          {statsQuery.isLoading ? (
            <div className="h-8 w-32 animate-pulse rounded bg-surface-container-high" />
          ) : (
            <p className="font-mono text-2xl font-bold text-zinc-100">
              {formatDecimal(stats?.outstanding)} USDC
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-outline-variant/5 bg-surface-container-low p-5">
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">
            Awaiting settlement
          </p>
          {statsQuery.isLoading ? (
            <div className="h-8 w-32 animate-pulse rounded bg-surface-container-high" />
          ) : (
            <p className="font-mono text-2xl font-bold text-primary">
              {formatDecimal(stats?.awaitingSettlement)} USDC
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-outline-variant/5 bg-surface-container-low p-5">
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">Invoices</p>
          {statsQuery.isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-surface-container-high" />
          ) : (
            <p className="text-lg font-bold text-zinc-100">{stats?.invoiceCount ?? 0}</p>
          )}
        </div>
        <div className="rounded-2xl border border-outline-variant/5 bg-surface-container-low p-5">
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">Settled</p>
          {statsQuery.isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-surface-container-high" />
          ) : (
            <p className="text-lg font-bold text-zinc-100">{stats?.settledCount ?? 0}</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-low/50 px-6 py-4">
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-zinc-500">
            {listQuery.isLoading ? "Loading…" : `Showing ${invoices.length} invoice(s)`}
          </span>
        </div>

        <div className="overflow-x-auto">
          {listQuery.error ? (
            <p className="p-6 text-sm text-error">{listQuery.error.message}</p>
          ) : listQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="p-8 text-sm text-zinc-500">No invoices for this contractor.</p>
          ) : (
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-surface-container-lowest text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Invoice ID</th>
                  <th className="px-6 py-4 font-bold">Contractor</th>
                  <th className="px-6 py-4 font-bold">Date issued</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 text-right font-bold">Amount due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {invoices.map((inv) => (
                  <tr key={String(inv.id)} className="transition-colors hover:bg-surface-container-high">
                    <td className="px-6 py-4 font-mono text-zinc-300">{shortId(String(inv.id))}</td>
                    <td className="px-6 py-4 font-medium text-zinc-100">{inv.contractor_full_name}</td>
                    <td className="px-6 py-4 text-zinc-400">—</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${
                          inv.status === "SETTLED"
                            ? "bg-secondary/10 text-secondary"
                            : inv.status === "FUNDED"
                              ? "bg-primary/10 text-primary"
                              : "bg-zinc-500/10 text-zinc-400"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-100">
                      {formatDecimal(inv.amount_due as string)}{" "}
                      <span className="text-[0.6rem] text-zinc-500">{inv.asset}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
