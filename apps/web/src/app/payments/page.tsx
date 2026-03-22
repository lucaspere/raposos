"use client";

import { useState } from "react";

export default function PaymentsPage() {
  const [companyId, setCompanyId] = useState("");
  const [contractorId, setContractorId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          company_id: companyId, 
          contractor_id: contractorId, 
          amount_due: Number(amount),
          asset: "USDC" 
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create invoice");

      setStatus("success");
      setMessage(`Invoice created with ID: ${data.invoice_id}`);
      setContractorId("");
      setAmount("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-12 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-on-background tracking-tight">Payments Setup</h1>
        <p className="text-zinc-400 text-sm">Issue new payout invoices to the network.</p>
      </div>

      <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10">
        <h2 className="text-xl font-headline font-bold text-on-background mb-6">Issue Invoice</h2>
        
        <form onSubmit={handleIssueInvoice} className="space-y-6 max-w-lg">
          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">Company UUID</label>
            <input
              type="text"
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/30 focus:ring-primary rounded-lg px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            />
          </div>

          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">Contractor UUID</label>
            <input
              type="text"
              required
              value={contractorId}
              onChange={(e) => setContractorId(e.target.value)}
              className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/30 focus:ring-primary rounded-lg px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            />
          </div>
          
          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">Amount (USDC)</label>
            <div className="relative">
              <input
                type="number"
                required
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/30 focus:ring-primary rounded-lg px-4 py-3 font-mono text-xl text-primary font-bold placeholder-zinc-600 focus:outline-none"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-zinc-500 font-mono text-sm">USDC</span>
              </div>
            </div>
          </div>

          {status === "error" && (
            <div className="bg-error-container/20 text-error text-sm p-3 rounded border border-error/20 flex items-start gap-2">
              <span className="material-symbols-outlined text-[1.2rem]">error</span>
              <p>{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="bg-secondary-container/20 text-secondary text-sm p-3 rounded border border-secondary/20 flex items-start gap-2">
              <span className="material-symbols-outlined text-[1.2rem]">check_circle</span>
              <p className="font-mono text-xs break-all">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full px-4 py-3 bg-primary text-on-primary rounded-lg font-bold text-sm hover:bg-primary-container transition-colors shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
          >
            {status === "loading" ? "Processing..." : "Issue Invoice"}
          </button>
        </form>
      </div>
    </div>
  );
}
