"use client";

import { useOnboarding } from "@/hooks/useOnboarding";
import { formatDecimal } from "@/lib/formatAmount";
import { trpc } from "@/trpc/react";
import { skipToken } from "@tanstack/react-query";
import Link from "next/link";

function eventLabel(eventType: string) {
  return eventType === "ACQUISITION" ? "Acquisition" : "Disposal";
}

export default function TaxCompliancePage() {
  const { profile, isLoaded } = useOnboarding();
  const contractorId = profile?.id;

  const listQuery = trpc.tax.listForContractor.useQuery(
    contractorId ? { contractorId } : skipToken,
  );
  const summaryQuery = trpc.tax.summaryForContractor.useQuery(
    contractorId ? { contractorId } : skipToken,
  );

  if (!isLoaded) {
    return (
      <div className="flex h-64 max-w-4xl items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!contractorId) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-outline-variant/10 bg-surface-container-low p-10 text-center">
        <h1 className="font-headline text-2xl font-bold text-on-background">No contractor profile</h1>
        <p className="mt-2 text-sm text-zinc-400">Onboard first to load tax records from the ledger.</p>
        <Link href="/onboarding" className="mt-6 inline-block text-sm font-bold text-primary hover:underline">
          Go to onboarding
        </Link>
      </div>
    );
  }

  const records = listQuery.data?.records ?? [];
  const s = summaryQuery.data;

  return (
    <div className="flex max-w-4xl flex-col gap-12">
      <div className="space-y-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-background">
          Tax engine &amp; analytics
        </h1>
        <p className="text-sm text-zinc-400">
          Tax records linked to your ledger transactions (live from the database).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-2 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">Avg. BRL rate</p>
          {summaryQuery.isLoading ? (
            <div className="h-9 w-28 animate-pulse rounded bg-surface-container-high" />
          ) : (
            <p className="font-mono text-2xl font-bold text-primary">
              {formatDecimal(s?.avgBrlExchangeRate, 4)} BRL
            </p>
          )}
        </div>
        <div className="space-y-2 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">Total BRL value</p>
          {summaryQuery.isLoading ? (
            <div className="h-9 w-28 animate-pulse rounded bg-surface-container-high" />
          ) : (
            <p className="font-mono text-2xl font-bold text-zinc-100">
              R$ {formatDecimal(s?.totalBrlValue, 2)}
            </p>
          )}
        </div>
        <div className="space-y-2 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">Realized capital gain</p>
          {summaryQuery.isLoading ? (
            <div className="h-9 w-28 animate-pulse rounded bg-surface-container-high" />
          ) : (
            <p className="font-mono text-2xl font-bold text-tertiary-container">
              R$ {formatDecimal(s?.totalCapitalGain, 2)}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="font-headline text-xl font-bold text-on-background">Tax events timeline</h2>

        {listQuery.error ? (
          <p className="text-sm text-error">{listQuery.error.message}</p>
        ) : listQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-sm text-zinc-500">No tax records yet for this contractor.</p>
        ) : (
          <div className="relative ml-4 space-y-8 border-l-2 border-surface-container-high pb-4">
            {records.map((rec) => {
              const acquisition = rec.event_type === "ACQUISITION";
              const tokenAmt = Number.parseFloat(String(rec.token_amount));
              const pos = tokenAmt > 0;
              return (
                <div key={String(rec.id)} className="relative pl-8">
                  <div
                    className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-background ${
                      acquisition ? "bg-secondary" : "bg-tertiary-container"
                    }`}
                  />
                  <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100">
                          {eventLabel(String(rec.event_type))} — {String(rec.ledger_tx_type).replace(/_/g, " ")}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500">{eventLabel(String(rec.event_type))} event</p>
                      </div>
                      <span className={`font-mono text-sm ${pos ? "text-secondary" : "text-tertiary-container"}`}>
                        {pos ? "+" : ""}
                        {formatDecimal(rec.token_amount as string)} USDC
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-container-lowest p-3 text-xs md:grid-cols-3">
                      <div>
                        <span className="text-zinc-500">BRL rate</span>
                        <p className="mt-1 font-mono font-medium text-zinc-300">
                          {formatDecimal(rec.brl_exchange_rate as string, 4)}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Total BRL</span>
                        <p className="mt-1 font-mono font-medium text-zinc-300">
                          R$ {formatDecimal(rec.total_brl_value as string, 2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Capital gain</span>
                        <p className="mt-1 font-mono font-bold text-secondary">
                          {rec.capital_gain != null
                            ? `R$ ${formatDecimal(rec.capital_gain as string, 2)}`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/10 p-6 sm:flex-row">
        <div>
          <h3 className="font-headline font-bold text-primary">Tax data from ledger</h3>
          <p className="mt-1 max-w-lg text-sm text-primary/80">
            Figures above are derived from tax_records joined to your ledger_transactions. Export or reporting can build
            on this API later.
          </p>
        </div>
      </div>
    </div>
  );
}
