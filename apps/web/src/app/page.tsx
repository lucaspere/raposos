"use client";

import DashboardActions from "@/components/DashboardActions";
import { useOnboarding } from "@/hooks/useOnboarding";
import { brlApproxFromUsdc, formatDecimal } from "@/lib/formatAmount";
import { ledgerTxIcon, ledgerTxTitle, shortenHash } from "@/lib/ledgerLabels";
import { trpc } from "@/trpc/react";
import { skipToken } from "@tanstack/react-query";
import Link from "next/link";

export default function DashboardPage() {
  const { profile, isLoaded } = useOnboarding();
  const contractorId = profile?.id;

  const balanceQuery = trpc.contractors.getBalance.useQuery(
    contractorId ? { id: contractorId } : skipToken,
  );
  const ledgerQuery = trpc.ledger.listByContractor.useQuery(
    contractorId ? { contractorId, limit: 50 } : skipToken,
  );
  const invoicesQuery = trpc.invoices.listForContractor.useQuery(
    contractorId ? { contractorId } : skipToken,
  );

  const pendingInvoices =
    invoicesQuery.data?.invoices.filter((inv) => inv.status === "PENDING") ?? [];

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!contractorId) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-outline-variant/10 bg-surface-container-low p-10 text-center">
        <h1 className="font-headline text-2xl font-bold text-on-background">No contractor profile</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Complete onboarding to load your balance and ledger from the database.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-bold text-on-primary"
        >
          Go to onboarding
        </Link>
      </div>
    );
  }

  const balanceStr = balanceQuery.data?.availableBalance;
  const balanceLoading = balanceQuery.isLoading;
  const balanceError = balanceQuery.error?.message;

  const txs = ledgerQuery.data?.transactions ?? [];
  const ledgerLoading = ledgerQuery.isLoading;
  const ledgerError = ledgerQuery.error?.message;

  return (
    <div className="flex flex-col gap-12 xl:flex-row">
      <section className="w-full flex-1 space-y-12">
        <div className="relative overflow-hidden rounded-3xl border border-outline-variant/5 bg-surface-container-lowest p-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative z-10 space-y-8">
            <div className="space-y-1">
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-zinc-500">
                Available Balance
              </span>
              {balanceLoading ? (
                <div className="h-16 w-48 animate-pulse rounded-lg bg-surface-container-high" />
              ) : balanceError ? (
                <p className="text-sm text-error">{balanceError}</p>
              ) : (
                <>
                  <div className="flex items-baseline gap-3">
                    <h1 className="font-mono text-5xl font-bold tracking-tighter text-on-background md:text-6xl">
                      {formatDecimal(balanceStr)}
                    </h1>
                    <span className="font-mono text-2xl font-medium text-primary">USDC</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-400">
                    ≈ {brlApproxFromUsdc(balanceStr)}
                  </p>
                </>
              )}
            </div>

            <DashboardActions defaultContractorId={contractorId} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-end justify-between">
            <h2 className="font-headline text-xl font-bold tracking-tight text-on-background">Recent Ledger</h2>
            <Link
              href="/invoices"
              className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
            >
              Invoices
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low">
            <div className="grid min-w-[500px] grid-cols-4 border-b border-outline-variant/10 px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">
              <span>Transaction</span>
              <span>Status</span>
              <span>Date</span>
              <span className="text-right">Amount</span>
            </div>

            <div className="overflow-x-auto">
              {ledgerLoading ? (
                <div className="flex min-h-[200px] items-center justify-center p-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                </div>
              ) : ledgerError ? (
                <p className="p-8 text-sm text-error">{ledgerError}</p>
              ) : txs.length === 0 ? (
                <p className="p-8 text-sm text-zinc-500">No ledger transactions yet.</p>
              ) : (
                <div className="min-w-[500px]">
                  {txs.map((row, i) => {
                    const amt = Number.parseFloat(String(row.amount));
                    const positive = amt > 0;
                    const date = row.created_at ? new Date(row.created_at as string) : null;
                    const status = String(row.status);
                    const txType = String(row.tx_type);
                    const icon = ledgerTxIcon(txType);
                    const isCompleted = status === "COMPLETED";
                    return (
                      <div
                        key={String(row.id)}
                        className={`grid grid-cols-4 items-center px-6 py-5 transition-colors hover:bg-surface-container-high ${
                          i > 0 ? "border-t border-outline-variant/5" : ""
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              positive ? "bg-secondary/10" : "bg-primary/10"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[1.2rem] ${
                                positive ? "text-secondary" : "text-primary"
                              }`}
                            >
                              {icon}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-100">{ledgerTxTitle(txType)}</p>
                            <p className="font-mono text-[0.65rem] text-zinc-500">
                              {shortenHash(row.tx_hash as string | null)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span
                            className={`rounded px-2 py-1 text-[0.65rem] font-bold uppercase leading-none ${
                              isCompleted
                                ? "bg-secondary-container/20 text-secondary"
                                : "bg-primary-container/20 text-primary"
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-zinc-400">
                          {date ? date.toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-mono text-sm font-bold ${
                              positive ? "text-secondary" : "text-zinc-100"
                            }`}
                          >
                            {positive ? "+" : ""}
                            {formatDecimal(row.amount as string)}
                          </p>
                          <p className="text-[0.6rem] text-zinc-500">USDC</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <aside className="hidden w-80 flex-col gap-6 xl:flex">
        <div className="space-y-4 rounded-2xl border border-outline-variant/5 bg-surface-container-lowest p-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">Protocol Health</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Wallet</span>
            <span className="font-mono text-xs text-secondary">Connected</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Data</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="text-xs text-zinc-100">Live from API</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-outline-variant/5 bg-surface-container-lowest p-6">
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">Pending invoices</p>
            <span className="material-symbols-outlined text-sm text-zinc-500">receipt_long</span>
          </div>
          {invoicesQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          ) : pendingInvoices.length === 0 ? (
            <p className="text-xs text-zinc-500">No pending invoices.</p>
          ) : (
            <div className="space-y-4">
              {pendingInvoices.slice(0, 4).map((inv) => (
                <div key={String(inv.id)} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full border border-outline-variant/20 bg-surface-container-high" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-zinc-100">{inv.contractor_full_name}</p>
                    <p className="font-mono text-[0.65rem] text-zinc-500">
                      {formatDecimal(inv.amount_due as string)} {inv.asset}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/invoices"
            className="mt-2 block w-full rounded-lg border border-primary/20 py-2 text-center text-xs font-bold text-primary transition-colors hover:bg-primary/5"
          >
            View invoices
          </Link>
        </div>
      </aside>
    </div>
  );
}
