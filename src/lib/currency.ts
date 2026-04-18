// Bicurrency formatting helpers — single source of truth
// All amounts in the app are stored as numbers + a currency code.
// Conversion uses a referential exchange rate where exchangeRate = "1 secondary = X primary".

const SYMBOLS: Record<string, string> = {
  PEN: 'S/',
  USD: '$',
  EUR: '€',
  COP: 'COP$',
  MXN: 'MX$',
  CLP: 'CLP$',
  ARS: 'ARS$',
  BRL: 'R$',
  GBP: '£',
  BOB: 'Bs',
  PYG: '₲',
  UYU: '$U',
  VES: 'Bs.S',
  GTQ: 'Q',
  HNL: 'L',
  NIO: 'C$',
  CRC: '₡',
  DOP: 'RD$',
};

export function getCurrencySymbol(currency: string): string {
  if (!currency) return 'S/';
  return SYMBOLS[currency] ?? currency;
}

export function formatCurrency(amount: number, currency: string): string {
  const sym = getCurrencySymbol(currency);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${sym} ${safe.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Convert an amount between primary and secondary currencies.
 * exchangeRate is always interpreted as: 1 secondary = X primary.
 * If from === to, returns the amount unchanged.
 * If neither side matches the configured pair, the amount is returned unchanged
 * (we never make up cross-rates).
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number,
  primaryCurrency?: string,
  secondaryCurrency?: string,
): number {
  if (!amount || !Number.isFinite(amount)) return 0;
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) return amount;
  if (!exchangeRate || exchangeRate <= 0) return amount;

  // If primary/secondary are provided, only convert across that exact pair.
  if (primaryCurrency && secondaryCurrency) {
    if (fromCurrency === secondaryCurrency && toCurrency === primaryCurrency) {
      return amount * exchangeRate;
    }
    if (fromCurrency === primaryCurrency && toCurrency === secondaryCurrency) {
      return amount / exchangeRate;
    }
    return amount; // unknown pair — leave untouched
  }

  // No pair context: assume the rate maps from -> to as "1 from = rate to"
  return amount * exchangeRate;
}
