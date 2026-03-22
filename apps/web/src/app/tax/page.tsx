export default function TaxCompliancePage() {
  return (
    <div className="flex flex-col gap-12 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-on-background tracking-tight">Tax Engine & Analytics</h1>
        <p className="text-zinc-400 text-sm">Automated basis and capital gains calculations synced with the Immutable Ledger.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 space-y-2">
          <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold">Live Sync Oracle</p>
          <p className="text-2xl font-mono font-bold text-primary">5.12 BRL</p>
        </div>
        
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 space-y-2">
          <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold">Avg. Cost Basis</p>
          <p className="text-2xl font-mono font-bold text-zinc-100">4.95 BRL</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 space-y-2">
          <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold">Realized Capital Gains</p>
          <p className="text-2xl font-mono font-bold text-tertiary-container">+R$ 204,00</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-headline font-bold text-on-background">Tax Events Timeline</h2>
        
        <div className="relative border-l-2 border-surface-container-high ml-4 space-y-8 pb-4">
          
          <div className="relative pl-8">
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-secondary border-4 border-background"></div>
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-zinc-100 text-sm">Contractor Payout — Engineering</h3>
                  <p className="text-xs text-zinc-500 mt-1">Acquisition Event</p>
                </div>
                <span className="font-mono text-sm text-secondary">+1,200.00 USDC</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs bg-surface-container-lowest p-3 rounded-lg">
                <div>
                  <span className="text-zinc-500">Fixed Exchange Rate</span>
                  <p className="font-mono font-medium text-zinc-300 mt-1">5.10 BRL</p>
                </div>
                <div>
                  <span className="text-zinc-500">Cost Basis (BRL)</span>
                  <p className="font-mono font-medium text-zinc-300 mt-1">R$ 6.120,00</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative pl-8">
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-tertiary-container border-4 border-background"></div>
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-zinc-100 text-sm">Off-ramp to Personal Account</h3>
                  <p className="text-xs text-zinc-500 mt-1">Disposal Event // PIX</p>
                </div>
                <span className="font-mono text-sm text-tertiary-container">-1,200.00 USDC</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs bg-surface-container-lowest p-3 rounded-lg">
                <div>
                  <span className="text-zinc-500">Spot Rate</span>
                  <p className="font-mono font-medium text-zinc-300 mt-1">5.15 BRL</p>
                </div>
                <div>
                  <span className="text-zinc-500">Sale Value (BRL)</span>
                  <p className="font-mono font-medium text-zinc-300 mt-1">R$ 6.180,00</p>
                </div>
                <div>
                  <span className="text-zinc-500">Capital Gain</span>
                  <p className="font-mono font-bold text-secondary mt-1">+R$ 60,00</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-primary font-headline">Tax Year 2026 - Ready for Accountant</h3>
          <p className="text-sm text-primary/80 mt-1 max-w-lg">All events have been reconciled with on-chain oracles. The report includes GCAP calculations and DARF ready-to-pay codes.</p>
        </div>
        <button className="px-6 py-3 bg-primary text-on-primary rounded-lg font-bold text-sm hover:bg-primary-container transition-all shadow-lg shadow-primary/20">
          Generate Report
        </button>
      </div>

    </div>
  );
}
