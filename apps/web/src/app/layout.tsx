import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Raposos Payroll // MVP",
  description: "B2B Crypto-to-Fiat Payroll Platform MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-on-background min-h-screen selection:bg-primary/30 font-sans`}
      >
        <header className="bg-[#131315]/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex justify-between items-center w-full px-6 py-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-8">
              <span className="font-mono text-lg font-bold tracking-tighter text-[#adc6ff]">
                PAYROLL // MVP
              </span>
              <nav className="hidden md:flex gap-6">
                <Link
                  className="text-[#adc6ff] border-b-2 border-[#adc6ff] pb-1 font-medium text-sm"
                  href="/"
                >
                  Dashboard
                </Link>
                <Link
                  className="text-zinc-500 hover:text-zinc-200 transition-colors text-sm"
                  href="/payments"
                >
                  Payments
                </Link>
                <Link
                  className="text-zinc-500 hover:text-zinc-200 transition-colors text-sm"
                  href="/invoices"
                >
                  Invoices
                </Link>
                <Link
                  className="text-zinc-500 hover:text-zinc-200 transition-colors text-sm"
                  href="/tax"
                >
                  Tax Engine
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                <span className="font-mono text-[0.75rem] text-primary">0x1A4...bC9</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-zinc-400 hover:text-zinc-200 cursor-pointer">
                  notifications
                </span>
                <span className="material-symbols-outlined text-zinc-400 hover:text-zinc-200 cursor-pointer">
                  settings
                </span>
                <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/20"></div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
          <aside className="hidden md:flex flex-col h-fit sticky top-24 w-64 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
            <div className="flex flex-col gap-2 mb-8">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-sm">
                    account_balance
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-100 leading-none">
                    Immutable Ledger
                  </p>
                  <p className="text-[0.65rem] text-zinc-500 uppercase tracking-widest mt-1">
                    Verified B2B
                  </p>
                </div>
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              <Link
                className="flex items-center gap-3 px-4 py-2.5 bg-[#2a2a2c] text-[#adc6ff] rounded-lg shadow-inner text-sm font-medium"
                href="/"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  dashboard
                </span>
                Overview
              </Link>
              <Link
                className="flex items-center gap-3 px-4 py-2.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 rounded-lg transition-all text-sm"
                href="/transactions"
              >
                <span className="material-symbols-outlined">account_balance_wallet</span>
                Transactions
              </Link>
              <Link
                className="flex items-center gap-3 px-4 py-2.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 rounded-lg transition-all text-sm"
                href="/invoices"
              >
                <span className="material-symbols-outlined">account_tree</span>
                Invoices
              </Link>
              <Link
                className="flex items-center gap-3 px-4 py-2.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 rounded-lg transition-all text-sm"
                href="/tax"
              >
                <span className="material-symbols-outlined">verified_user</span>
                Compliance
              </Link>
            </nav>
            <div className="mt-12 pt-6 border-t border-outline-variant/10">
              <button className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]">
                New Payroll
              </button>
            </div>
            <div className="mt-auto pt-12 flex flex-col gap-1">
              <a
                className="flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-zinc-300 text-xs"
                href="#"
              >
                <span className="material-symbols-outlined text-sm">help</span>
                Support
              </a>
              <a
                className="flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-zinc-300 text-xs"
                href="#"
              >
                <span className="material-symbols-outlined text-sm">description</span>
                Documentation
              </a>
            </div>
          </aside>

          <div className="flex-1">{children}</div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#131315]/80 backdrop-blur-xl px-6 py-4 flex justify-between items-center z-50 border-t border-outline-variant/5">
          <Link className="flex flex-col items-center gap-1 text-primary" href="/">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              dashboard
            </span>
            <span className="text-[0.6rem] font-medium uppercase tracking-tighter">
              Home
            </span>
          </Link>
          <Link className="flex flex-col items-center gap-1 text-zinc-500" href="/payments">
            <span className="material-symbols-outlined">payments</span>
            <span className="text-[0.6rem] font-medium uppercase tracking-tighter">
              Pay
            </span>
          </Link>
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center -translate-y-6 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary">add</span>
          </div>
          <Link className="flex flex-col items-center gap-1 text-zinc-500" href="/invoices">
            <span className="material-symbols-outlined">group</span>
            <span className="text-[0.6rem] font-medium uppercase tracking-tighter">
              Invoices
            </span>
          </Link>
          <Link className="flex flex-col items-center gap-1 text-zinc-500" href="/tax">
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-[0.6rem] font-medium uppercase tracking-tighter">
              Tax
            </span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
