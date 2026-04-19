'use client';

import AppLayout from '@/components/ui/AppLayout';
import OnboardingGuard from '@/components/onboarding/OnboardingGuard';
import { TrpcProvider } from '@/trpc/react';
import { Web3Provider } from '@/components/providers/Web3Provider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider>
      <Web3Provider>
        <OnboardingGuard>
          <AppLayout>{children}</AppLayout>
        </OnboardingGuard>
      </Web3Provider>
    </TrpcProvider>
  );
}
