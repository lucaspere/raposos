'use client';

import { useState, useEffect } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { trpc } from '@/trpc/react';
import { TRPCClientError } from '@trpc/client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

type Step = 'welcome' | 'details' | 'success';

function trpcMessage(err: unknown): string {
  if (err instanceof TRPCClientError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred';
}

export default function OnboardingFlow() {
  const [step, setStep] = useState<Step>('welcome');
  const { saveProfile } = useOnboarding();
  const { address, isConnected } = useAccount();
  const createContractor = trpc.contractors.create.useMutation();
  const createWallet = trpc.wallets.create.useMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    cnpj: '',
    pixKey: '',
  });

  useEffect(() => {
    if (step === 'welcome' && isConnected && address) {
      setStep('details');
    }
  }, [isConnected, address, step]);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const { contractorId } = await createContractor.mutateAsync({
        fullName: formData.fullName,
        brTaxId: formData.cnpj,
        pixKey: formData.pixKey,
      });

      await createWallet.mutateAsync({
        ownerId: contractorId,
        address,
      });

      // Save to local storage for session management
      saveProfile({
        id: contractorId,
        walletAddress: address,
        ...formData,
      });

      setStep('success');
    } catch (err: unknown) {
      setError(trpcMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#131315] text-[#e5e1e4] font-['Inter'] overflow-x-hidden flex flex-col relative z-0">
      {/* Background Decoration */}
      <div className="fixed top-0 right-0 w-1/3 h-1/2 bg-[#adc6ff]/5 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-1/4 h-1/3 bg-[#4edea3]/5 blur-[100px] -z-10 pointer-events-none"></div>
      
      {/* Step 1: Welcome & Connect Wallet */}
      {step === 'welcome' && (
        <main className="flex-grow flex items-center justify-center pt-16 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-4xl w-full flex flex-col items-center text-center z-10">
            {/* Hero Decorative Element */}
            <div className="mb-12 relative w-64 h-64 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#adc6ff]/10 rounded-full blur-3xl"></div>
              <div className="relative w-48 h-48 bg-[#2a2a2c] rounded-xl rotate-3 flex items-center justify-center overflow-hidden">
                <img 
                  className="w-full h-full object-cover opacity-80 mix-blend-lighten" 
                  alt="Abstract shapes" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4vwttcr0xFo_paty56PcOfBVvChl8JrpEubVtFWLy0JwvPEsQ4WawoH6tmiPtpp7h-zIHLhFXYFZKRtdd9XmP8HQk4Ia4u34XINOf-y1koZqtq2FBt6WtjCd2h4oHdUPBy3FUUK8tuxWcV0giOY4LDlBB4M9k7MW2a-duHjJsvtLU0Z7l0oI7v9YNLQlfxX9CffXII4aID1iObeHma_1x-SKsG0EaJzSQ8VGqqoxGFAjENMujXEDEbtm7Cq9teyX6R6hIHB4rue8"
                />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#353437] rounded-xl -rotate-6 border border-[#424754]/10 flex flex-col p-4 justify-between">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-[#adc6ff]">account_balance_wallet</span>
                  <div className="w-8 h-8 rounded-full bg-[#4edea3]/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#4edea3]"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-16 bg-[#424754]/30 rounded"></div>
                  <div className="h-2 w-24 bg-[#424754]/20 rounded"></div>
                </div>
              </div>
            </div>

            {/* Content */}
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-[#e5e1e4] mb-6 max-w-2xl leading-[1.1]">
              Welcome to <span className="text-[#adc6ff]">Immutable Ledger</span>
            </h1>
            <p className="text-[#c2c6d6] text-lg md:text-xl max-w-xl mb-12 font-medium">
              Connect your Web3 wallet to start receiving stablecoin payouts with mathematical transparency.
            </p>

            {/* Actions */}
            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
              <div className="mx-auto flex w-full max-w-sm justify-center">
                <ConnectButton showBalance={false} />
              </div>

              <div className="flex items-center gap-4 py-6 w-full">
                <div className="h-[1px] flex-grow bg-[#424754]/20"></div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-['JetBrains_Mono'] text-zinc-500">Supported Networks</span>
                <div className="h-[1px] flex-grow bg-[#424754]/20"></div>
              </div>

              <div className="flex justify-center gap-6 opacity-60">
                <div className="flex items-center gap-2 group transition-all hover:opacity-100">
                  <span className="material-symbols-outlined text-sm">token</span>
                  <span className="font-['JetBrains_Mono'] text-xs uppercase tracking-widest">Ethereum</span>
                </div>
                <div className="flex items-center gap-2 group transition-all hover:opacity-100">
                  <span className="material-symbols-outlined text-sm">speed</span>
                  <span className="font-['JetBrains_Mono'] text-xs uppercase tracking-widest">Polygon</span>
                </div>
                <div className="flex items-center gap-2 group transition-all hover:opacity-100">
                  <span className="material-symbols-outlined text-sm">hub</span>
                  <span className="font-['JetBrains_Mono'] text-xs uppercase tracking-widest">Base</span>
                </div>
              </div>
            </div>

            {/* Trust Indicator */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl text-left">
              <div className="p-6 bg-[#1c1b1d] rounded-xl flex flex-col gap-3">
                <span className="material-symbols-outlined text-[#4edea3]">verified_user</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Audited Security</h3>
                <p className="text-xs text-zinc-500 font-medium">Smart contracts verified by top-tier firms ensuring your assets are permanently safe.</p>
              </div>
              <div className="p-6 bg-[#1c1b1d] rounded-xl flex flex-col gap-3">
                <span className="material-symbols-outlined text-[#adc6ff]">account_tree</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Zero-Gas Payouts</h3>
                <p className="text-xs text-zinc-500 font-medium">Native stablecoin distribution with zero network fees for contractors.</p>
              </div>
              <div className="p-6 bg-[#1c1b1d] rounded-xl flex flex-col gap-3">
                <span className="material-symbols-outlined text-[#ffb5a1]">monitoring</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Real-time Proof</h3>
                <p className="text-xs text-zinc-500 font-medium">Every transaction is recorded on-chain, creating an immutable financial history.</p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Step 2: Contractor KYC */}
      {step === 'details' && (
        <main className="pt-24 pb-20 px-4 flex justify-center items-center flex-grow animate-in fade-in slide-in-from-bottom-4 duration-500 z-10">
          <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Contextual Content */}
            <div className="lg:col-span-5 pt-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#adc6ff]/10 text-[#adc6ff] text-[10px] font-bold tracking-[0.1em] uppercase mb-6">
                Compliance Protocol v2.4
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-zinc-50 leading-tight mb-6">
                Verify Your <br/><span className="text-[#adc6ff]">Financial Identity.</span>
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-md">
                To maintain regulatory standards for cross-border B2B crypto payroll, please provide your contractor details for instant KYC verification.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-[#4edea3]">
                    <span className="material-symbols-outlined">verified_user</span>
                  </div>
                  <div>
                    <h4 className="text-zinc-100 font-semibold">Immutable Record</h4>
                    <p className="text-sm text-zinc-500">Your data is hashed and stored securely on the ledger.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-[#adc6ff]">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <h4 className="text-zinc-100 font-semibold">Instant Liquidity</h4>
                    <p className="text-sm text-zinc-500">Verification enables sub-second PIX settlement in BRL.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: KYC Form */}
            <div className="lg:col-span-7 w-full">
              <div className="bg-[#1c1b1d] rounded-xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#adc6ff]/5 blur-[100px] rounded-full group-hover:bg-[#adc6ff]/10 transition-colors duration-500"></div>
                
                <div className="relative z-10">
                  <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-zinc-50 mb-2">Contractor KYC</h2>
                      <div className="h-1 w-12 bg-[#adc6ff] rounded-full mb-4"></div>
                      <p className="text-zinc-500 text-sm">Please fill the form below with your registered business information.</p>
                    </div>
                    <ConnectButton showBalance={false} chainStatus="icon" />
                  </header>

                  {error && (
                    <div className="mb-6 p-4 bg-[#93000a] text-[#ffdad6] rounded-lg text-sm border border-[#ffb4ab]/20">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleDetailsSubmit} className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-[0.05em] text-zinc-500 uppercase">Connected Wallet</label>
                      <div className="relative">
                        <div className="w-full bg-[#0e0e10] border-0 rounded-lg py-4 px-5 font-['JetBrains_Mono'] text-[#adc6ff] flex items-center justify-between text-sm overflow-hidden text-ellipsis">
                          {address}
                          <span className="material-symbols-outlined text-lg text-[#4edea3] ml-2">check_circle</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-[0.05em] text-zinc-500 uppercase">Full Name / Company Name</label>
                      <div className="relative">
                        <input 
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full bg-[#0e0e10] border border-[#424754]/20 focus:border-[#adc6ff]/50 focus:ring-1 focus:ring-[#adc6ff]/30 rounded-lg py-4 px-5 font-['JetBrains_Mono'] text-[#adc6ff] placeholder-zinc-700 transition-all outline-none" 
                          placeholder="Jane Doe" 
                          type="text"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                          <span className="material-symbols-outlined text-lg">person</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-[0.05em] text-zinc-500 uppercase">Brazilian Tax ID (CNPJ)</label>
                      <div className="relative">
                        <input 
                          required
                          value={formData.cnpj}
                          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                          className="w-full bg-[#0e0e10] border border-[#424754]/20 focus:border-[#adc6ff]/50 focus:ring-1 focus:ring-[#adc6ff]/30 rounded-lg py-4 px-5 font-['JetBrains_Mono'] text-[#adc6ff] placeholder-zinc-700 transition-all outline-none" 
                          placeholder="00.000.000/0001-00" 
                          type="text"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                          <span className="material-symbols-outlined text-lg">badge</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-[0.05em] text-zinc-500 uppercase">PIX Key</label>
                      <div className="relative">
                        <input 
                          required
                          value={formData.pixKey}
                          onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                          className="w-full bg-[#0e0e10] border border-[#424754]/20 focus:border-[#adc6ff]/50 focus:ring-1 focus:ring-[#adc6ff]/30 rounded-lg py-4 px-5 font-['JetBrains_Mono'] text-[#adc6ff] placeholder-zinc-700 transition-all outline-none" 
                          placeholder="your-key@email.com" 
                          type="text"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                          <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1 italic">Note: This account must be linked to the CNPJ provided above.</p>
                    </div>

                    <div className="pt-6">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#adc6ff] hover:bg-[#4d8eff] text-[#002e6a] font-bold py-5 rounded-lg transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSubmitting ? 'Registering...' : 'Complete Registration'}
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </button>
                      <p className="text-center text-xs text-zinc-600 mt-6 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-xs">lock</span>
                        Your data is encrypted using AES-256 standards
                      </p>
                    </div>
                  </form>
                </div>
              </div>

              {/* Auxiliary Data */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1c1b1d]/50 p-4 rounded-lg">
                  <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></div>
                    <span className="text-xs text-zinc-300 font-['JetBrains_Mono'] uppercase">Awaiting Input</span>
                  </div>
                </div>
                <div className="bg-[#1c1b1d]/50 p-4 rounded-lg">
                  <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Network</div>
                  <div className="text-xs text-zinc-300 font-['JetBrains_Mono'] uppercase">ETH_MAINNET</div>
                </div>
                <div className="bg-[#1c1b1d]/50 p-4 rounded-lg">
                  <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Region</div>
                  <div className="text-xs text-zinc-300 font-['JetBrains_Mono'] uppercase">LATAM_BR</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Step 3: Success */}
      {step === 'success' && (
        <main className="flex-grow flex items-center justify-center pt-16 px-6 animate-in zoom-in duration-500 z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-[#4edea3]/10 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-[#4edea3]/20">
              <span className="material-symbols-outlined text-[#4edea3] text-4xl">
                verified
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-50">
                Registration Complete
              </h2>
              <p className="text-zinc-400 text-base max-w-sm mx-auto">
                Your profile has been verified. You are now ready to receive stablecoin payments.
              </p>
            </div>
            <button
              onClick={handleComplete}
              className="mt-6 px-8 py-4 bg-[#2a2a2c] hover:bg-[#353437] text-zinc-50 rounded-xl font-medium text-base border border-[#424754]/20 transition-all active:scale-[0.98]"
            >
              Go to Dashboard
            </button>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="w-full flex justify-between items-center px-8 py-6 bg-transparent mt-auto z-10">
        <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-zinc-600">
          © 2024 Immutable Ledger. Financial transparency by design.
        </div>
        <div className="flex gap-8">
          <a className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-opacity duration-300" href="#">Terms</a>
          <a className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-opacity duration-300" href="#">Privacy</a>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></div>
            <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-zinc-600">Network Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
