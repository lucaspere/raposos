# Design System

## Overview
A trust-inspiring, Web3-native financial interface for B2B contractor payroll.
Dark mode by default, high contrast for financial data, blending enterprise compliance with crypto minimalism.

## Colors
- **Primary** (#3b82f6): Main CTAs (e.g., "Withdraw via PIX"), active states, Web3 actions
- **Success/Money** (#10b981): Positive balances, "SETTLED" statuses, financial growth
- **Surface** (#09090b): Main page backgrounds (Deep off-black/Zinc)
- **Surface-Variant** (#18181b): Cards, tables, modals, and elevated UI elements
- **On-surface** (#f4f4f5): Primary text and active data points
- **Secondary Text** (#a1a1aa): Supporting text, timestamps, crypto wallet addresses
- **Pending/Warning** (#f59e0b): "PENDING" invoice statuses, warnings

## Typography
- **Headlines**: Inter, semi-bold, clean and authoritative
- **Data & Financials**: JetBrains Mono (or Space Mono), regular/bold. Used for ALL balances (USDC/BRL), wallet addresses, and transaction hashes
- **Body**: Inter, regular, 14px
- **Labels**: Inter, medium, 12px, uppercase for table headers and section dividers

## Components
- **Buttons**: Rounded corners (8px). Primary uses the blue fill; Secondary uses transparent background with a 1px border (#27272a)
- **Cards & Tables**: Flat design, 1px border (#27272a), subtle surface-variant background. Strictly no drop-shadows or elevation to keep a brutalist/modern feel
- **Badges**: Pill-shaped (fully rounded). Used for statuses. Use 10% opacity background of the text color (e.g., Emerald background at 10% opacity with 100% Emerald text for "FUNDED")
- **Inputs**: 1px border (#27272a), slightly lighter dark background (#18181b), changes border to Primary color on focus

## Do's and Don'ts
- Do use Monospace fonts for all numbers, amounts, and blockchain data to reinforce the Web3 developer vibe
- Don't use heavy shadows or gradients; rely on subtle borders and background color contrast to create depth
- Do use skeleton loaders with a subtle pulse animation instead of generic circular spinners when fetching blockchain or PIX API data
- Don't clutter the main dashboard; the user's available USDC balance and the "Withdraw" action must be the focal points