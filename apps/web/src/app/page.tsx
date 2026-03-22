import DashboardActions from "@/components/DashboardActions";

export default function DashboardPage() {
  return (
    <div className="flex flex-col xl:flex-row gap-12">
      <section className="flex-1 space-y-12 w-full">
        {/* Hero Balance Section */}
        <div className="relative overflow-hidden p-10 rounded-3xl bg-surface-container-lowest border border-outline-variant/5">
          {/* Decorative element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="space-y-1">
              <span className="text-[0.7rem] uppercase tracking-[0.2em] text-zinc-500 font-medium">Available Balance</span>
              <div className="flex items-baseline gap-3">
                <h1 className="text-5xl md:text-6xl font-mono font-bold text-on-background tracking-tighter">5,000.00</h1>
                <span className="text-2xl font-mono text-primary font-medium">USDC</span>
              </div>
              <p className="text-zinc-400 text-sm font-medium">≈ R$ 25.500,00</p>
            </div>
            
            <DashboardActions />
          </div>
        </div>
        
        {/* Transactions Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-xl font-headline font-bold tracking-tight text-on-background">Recent Ledger</h2>
            <a className="text-primary text-xs font-bold uppercase tracking-widest hover:underline" href="#">View All</a>
          </div>
          
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
            {/* Transaction Header */}
            <div className="grid grid-cols-4 px-6 py-4 border-b border-outline-variant/10 text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold min-w-[500px]">
              <span>Transaction</span>
              <span>Status</span>
              <span>Date</span>
              <span className="text-right">Amount</span>
            </div>
            
            {/* Transaction Rows */}
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-4 px-6 py-5 items-center hover:bg-surface-container-high transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-[1.2rem]">arrow_downward</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-100">Payroll Deposit</p>
                      <p className="font-mono text-[0.65rem] text-zinc-500">0x71C...3E21</p>
                    </div>
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-secondary-container/20 text-secondary text-[0.65rem] font-bold uppercase rounded leading-none">Completed</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-medium">Oct 24, 2026</div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-secondary">+2,450.00</p>
                    <p className="text-[0.6rem] text-zinc-500">USDC</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 px-6 py-5 items-center hover:bg-surface-container-high transition-colors cursor-pointer group border-t border-outline-variant/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[1.2rem]">payments</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-100">Contractor Payout</p>
                      <p className="font-mono text-[0.65rem] text-zinc-500">dev_jane.eth</p>
                    </div>
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-primary-container/20 text-primary text-[0.65rem] font-bold uppercase rounded leading-none">Processing</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-medium">Oct 23, 2026</div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-zinc-100">-850.00</p>
                    <p className="text-[0.6rem] text-zinc-500">USDC</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 px-6 py-5 items-center hover:bg-surface-container-high transition-colors cursor-pointer group border-t border-outline-variant/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-tertiary text-[1.2rem]">account_balance_wallet</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-100">PIX Withdrawal</p>
                      <p className="font-mono text-[0.65rem] text-zinc-500">Bank Transfer</p>
                    </div>
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-secondary-container/20 text-secondary text-[0.65rem] font-bold uppercase rounded leading-none">Completed</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-medium">Oct 21, 2026</div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-zinc-100">-1,200.00</p>
                    <p className="text-[0.6rem] text-zinc-500">USDC</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Right Insights Column */}
      <aside className="hidden xl:flex flex-col gap-6 w-80">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5 space-y-4">
          <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold">Protocol Health</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Gas Price</span>
            <span className="font-mono text-xs text-secondary">14 Gwei</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Network</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
              <span className="text-xs text-zinc-100">Ethereum Mainnet</span>
            </div>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold">Upcoming Payroll</p>
            <span className="material-symbols-outlined text-zinc-500 text-sm">calendar_today</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-outline-variant/20 bg-surface-container-high"></div>
              <div>
                <p className="text-xs font-bold text-zinc-100">Jane Smith</p>
                <p className="text-[0.65rem] text-zinc-500 font-mono">3,200.00 USDC</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-outline-variant/20 bg-surface-container-high"></div>
              <div>
                <p className="text-xs font-bold text-zinc-100">Alex Chen</p>
                <p className="text-[0.65rem] text-zinc-500 font-mono">2,850.00 USDC</p>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-2 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors border border-primary/20">
            Schedule New
          </button>
        </div>
      </aside>
    </div>
  );
}
