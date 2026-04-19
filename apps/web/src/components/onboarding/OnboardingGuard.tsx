'use client';

import { useOnboarding } from '@/hooks/useOnboarding';
import { usePathname } from 'next/navigation';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useOnboarding();
  const pathname = usePathname();

  // We could show a loading spinner here while checking localStorage
  // But to avoid flashing, we can just return children or a minimal loader.
  // The hook handles the redirect automatically.
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // If on the onboarding page, we don't want the regular layout (header/sidebar)
  // Let the page render on its own layout or hide the guard wrappers.
  // Actually, we can return the children. We'll handle layout conditionally in layout.tsx.
  return <>{children}</>;
}
