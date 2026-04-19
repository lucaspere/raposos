'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useOnboarding } from '@/hooks/useOnboarding';
import { trpc } from '@/trpc/react';
import { skipToken } from '@tanstack/react-query';

interface ContractorDetails {
  id: string;
  full_name: string;
  br_tax_id: string;
  pix_key: string;
  wallet_address: string;
}

export default function ProfilePage() {
  const { profile } = useOnboarding();
  const { data, isLoading, error } = trpc.contractors.getById.useQuery(
    profile?.id ? { id: profile.id } : skipToken,
  );

  const details: ContractorDetails | null = data?.contractor
    ? (data.contractor as ContractorDetails)
    : null;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant/10">
        <h2 className="text-xl font-bold text-on-surface mb-2">Profile Unavailable</h2>
        <p className="text-zinc-400">
          {error?.message || 'Could not load your profile. Are you onboarded?'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Your Profile</h1>
          <p className="text-zinc-400 text-sm">Manage your identity and linked wallets.</p>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>

      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-outline-variant/10 flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-bold uppercase">
            {details.full_name.substring(0, 2)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">{details.full_name}</h2>
            <p className="text-sm font-mono text-zinc-500 mt-1">ID: {details.id.split('-')[0]}...</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Brazilian Tax ID (CNPJ)
              </label>
              <div className="font-mono text-on-surface bg-surface-container-lowest px-4 py-3 rounded-lg border border-outline-variant/10">
                {details.br_tax_id}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                PIX Key
              </label>
              <div className="font-mono text-on-surface bg-surface-container-lowest px-4 py-3 rounded-lg border border-outline-variant/10">
                {details.pix_key}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Linked Web3 Wallet
            </label>
            <div className="font-mono text-primary bg-surface-container-lowest px-4 py-3 rounded-lg border border-outline-variant/10 flex items-center justify-between">
              {details.wallet_address ?? '—'}
              <span className="material-symbols-outlined text-secondary text-sm">verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
