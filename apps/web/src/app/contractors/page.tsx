"use client";

import { useState } from "react";

export default function ContractorsPage() {
  const [fullName, setFullName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/contractors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, br_tax_id: taxId, pix_key: pixKey }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create contractor");

      setStatus("success");
      setMessage(`Contractor created with ID: ${data.contractor_id}`);
      setFullName("");
      setTaxId("");
      setPixKey("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-12 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-on-background tracking-tight">Contractors</h1>
        <p className="text-zinc-400 text-sm">Onboard and manage team members in the immutable ledger.</p>
      </div>

      <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10">
        <h2 className="text-xl font-headline font-bold text-on-background mb-6">Onboard Contractor</h2>
        
        <form onSubmit={handleCreate} className="space-y-6 max-w-lg">
          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/30 focus:ring-primary rounded-lg px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              placeholder="e.g. Satoshi Nakamoto"
            />
          </div>
          
          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">CPF / CNPJ (Tax ID)</label>
            <input
              type="text"
              required
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/30 focus:ring-primary rounded-lg px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">PIX Key</label>
            <input
              type="text"
              required
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/30 focus:ring-primary rounded-lg px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              placeholder="email@example.com"
            />
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
            {status === "loading" ? "Processing..." : "Register Contractor"}
            {!status && <span className="material-symbols-outlined text-[1.2rem]">person_add</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
