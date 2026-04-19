export function formatDecimal(value: string | number | null | undefined, maxFrac = 6): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFrac,
  });
}

export function brlApproxFromUsdc(usdc: string | number | null | undefined, rate = 5): string {
  const n = typeof usdc === "string" ? Number.parseFloat(usdc) : Number(usdc);
  if (Number.isNaN(n)) return "—";
  const brl = n * rate;
  return brl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
