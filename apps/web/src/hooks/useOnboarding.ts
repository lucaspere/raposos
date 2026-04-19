import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface ContractorProfile {
  id?: string;
  walletAddress: string;
  fullName: string;
  cnpj: string;
  pixKey: string;
}

export function useOnboarding() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<ContractorProfile | null>(null);

  useEffect(() => {
    const storedProfile = localStorage.getItem('contractor_profile');
    if (storedProfile) {
      try {
        setProfile(JSON.parse(storedProfile));
      } catch (e) {
        console.error('Failed to parse profile', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Redirect to onboarding if not onboarded and not already on the onboarding page
    if (!profile && !pathname.startsWith('/onboarding')) {
      router.replace('/onboarding');
    }
    
    // If they are onboarded and on the onboarding page, send them to dashboard
    if (profile && pathname.startsWith('/onboarding')) {
      router.replace('/');
    }
  }, [isLoaded, profile, pathname, router]);

  const saveProfile = (newProfile: ContractorProfile) => {
    localStorage.setItem('contractor_profile', JSON.stringify(newProfile));
    setProfile(newProfile);
    router.replace('/');
  };

  const clearProfile = () => {
    localStorage.removeItem('contractor_profile');
    setProfile(null);
    router.replace('/onboarding');
  };

  return {
    isLoaded,
    profile,
    saveProfile,
    clearProfile,
  };
}
