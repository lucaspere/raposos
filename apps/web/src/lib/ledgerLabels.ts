export function ledgerTxTitle(txType: string): string {
  switch (txType) {
    case "DEPOSIT":
      return "Deposit";
    case "CRYPTO_WITHDRAWAL":
      return "Crypto withdrawal";
    case "FIAT_OFFRAMP_RESERVATION":
      return "PIX withdrawal (reserved)";
    case "FIAT_OFFRAMP_SETTLEMENT":
      return "PIX settlement";
    case "FIAT_OFFRAMP_REVERSAL":
      return "PIX reversal";
    default:
      return txType;
  }
}

export function ledgerTxIcon(txType: string): string {
  switch (txType) {
    case "DEPOSIT":
      return "arrow_downward";
    case "FIAT_OFFRAMP_RESERVATION":
    case "FIAT_OFFRAMP_SETTLEMENT":
    case "FIAT_OFFRAMP_REVERSAL":
      return "payments";
    default:
      return "account_balance_wallet";
  }
}

export function shortenHash(hash: string | null | undefined, keep = 6): string {
  if (!hash) return "—";
  if (hash.length <= keep * 2 + 1) return hash;
  return `${hash.slice(0, keep)}…${hash.slice(-keep)}`;
}
