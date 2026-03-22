export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-12 max-w-5xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-on-background tracking-tight">Invoices</h1>
        <p className="text-zinc-400 text-sm">Manage outgoing contractor payments and historical billing records through the immutable ledger.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/5">
          <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">Total Outstanding</p>
          <p className="text-2xl font-mono font-bold text-zinc-100">14,290.50 USDC</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/5">
          <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">Awaiting Settlement</p>
          <p className="text-2xl font-mono font-bold text-primary">4,102.00 USDC</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/5">
          <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">Next Payout</p>
          <p className="text-lg font-bold text-zinc-100 mt-1">Oct 24, 2026</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/5">
          <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">Contractors Paid</p>
          <p className="text-lg font-bold text-zinc-100 mt-1">12</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
          <span className="text-[0.7rem] uppercase tracking-widest text-zinc-500 font-bold">Showing 4 Invoices</span>
          <button className="text-primary text-sm font-semibold hover:underline">Download CSV</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-container-lowest text-zinc-500 text-[0.65rem] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-bold">Invoice ID</th>
                <th className="px-6 py-4 font-bold">Contractor</th>
                <th className="px-6 py-4 font-bold">Date Issued</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Amount Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {[
                { id: "INV-2026-100", name: "Jane Smith", date: "Oct 20, 2026", status: "PENDING", amount: "3,200.00" },
                { id: "INV-2026-101", name: "Alex Chen", date: "Oct 21, 2026", status: "FUNDED", amount: "2,850.00" },
                { id: "INV-2026-102", name: "DevOps Agency", date: "Oct 15, 2026", status: "SETTLED", amount: "5,000.00" },
                { id: "INV-2026-103", name: "Marketing LLC", date: "Oct 10, 2026", status: "SETTLED", amount: "3,240.50" }
              ].map((inv, i) => (
                <tr key={i} className="hover:bg-surface-container-high transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-mono text-zinc-300">{inv.id}</td>
                  <td className="px-6 py-4 font-medium text-zinc-100">{inv.name}</td>
                  <td className="px-6 py-4 text-zinc-400">{inv.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide rounded ${
                      inv.status === 'SETTLED' ? 'bg-secondary/10 text-secondary' : 
                      inv.status === 'FUNDED' ? 'bg-primary/10 text-primary' : 
                      'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-zinc-100">
                    {inv.amount} <span className="text-[0.6rem] text-zinc-500">USDC</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
