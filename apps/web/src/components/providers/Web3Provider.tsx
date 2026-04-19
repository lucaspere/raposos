'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage, WagmiProvider } from 'wagmi';
import { arbitrum, base, mainnet, optimism, polygon } from 'wagmi/chains';

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'b56e18d47c72ab683b108154629fbf8c';

const chains = [mainnet, polygon, optimism, arbitrum, base] as const;

export const wagmiConfig = getDefaultConfig({
  appName: 'Raposos Payroll',
  appDescription: 'B2B Crypto-to-Fiat Payroll',
  appUrl:
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://raposos.com',
  appIcon: 'https://avatars.githubusercontent.com/u/37784886',
  projectId,
  chains,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: '#adc6ff',
          accentColorForeground: '#002e6a',
          borderRadius: 'medium',
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
