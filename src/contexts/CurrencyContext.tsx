import React, { createContext, useContext } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { getCurrencySymbol, formatCurrency, convertCurrency } from '@/lib/currency';

interface CurrencyContextType {
  currency: string;
  symbol: string;
  primaryCurrency: string;
  primarySymbol: string;
  secondaryCurrency: string;
  secondarySymbol: string;
  exchangeRate: number;
  /** Format an amount with a specific currency code (defaults to primary). */
  formatAmount: (amount: number, currencyCode?: string) => string;
  /** Format an amount + an explicit currency. */
  formatWithCurrency: (amount: number, currencyCode: string) => string;
  /** Convert between the configured primary/secondary pair. */
  convert: (amount: number, fromCurrency: string, toCurrency: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'PEN',
  symbol: 'S/',
  primaryCurrency: 'PEN',
  primarySymbol: 'S/',
  secondaryCurrency: 'USD',
  secondarySymbol: '$',
  exchangeRate: 3.75,
  formatAmount: (n) => formatCurrency(n, 'PEN'),
  formatWithCurrency: (n, c) => formatCurrency(n, c),
  convert: (n) => n,
});

export const useCurrency = () => useContext(CurrencyContext);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { prefs } = useUserPreferences();
  const symbol = getCurrencySymbol(prefs.currency);
  const primarySymbol = getCurrencySymbol(prefs.primaryCurrency);
  const secondarySymbol = getCurrencySymbol(prefs.secondaryCurrency);

  const formatAmount = (amount: number, currencyCode?: string) =>
    formatCurrency(amount, currencyCode || prefs.currency);

  const formatWithCurrency = (amount: number, currencyCode: string) =>
    formatCurrency(amount, currencyCode);

  const convert = (amount: number, fromCurrency: string, toCurrency: string) =>
    convertCurrency(amount, fromCurrency, toCurrency, prefs.exchangeRate, prefs.primaryCurrency, prefs.secondaryCurrency);

  return (
    <CurrencyContext.Provider value={{
      currency: prefs.currency,
      symbol,
      primaryCurrency: prefs.primaryCurrency,
      primarySymbol,
      secondaryCurrency: prefs.secondaryCurrency,
      secondarySymbol,
      exchangeRate: prefs.exchangeRate,
      formatAmount,
      formatWithCurrency,
      convert,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}
