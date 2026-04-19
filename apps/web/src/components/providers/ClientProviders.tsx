'use client';

import AppLayout from '@/components/ui/AppLayout';
import OnboardingGuard from '@/components/onboarding/OnboardingGuard';
import { TrpcProvider } from '@/trpc/react';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider>
      <OnboardingGuard>
        <AppLayout>{children}</AppLayout>
      </OnboardingGuard>
    </TrpcProvider>
  );
}
