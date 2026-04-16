import React, { createContext, useContext } from 'react';
import { useUserPreferences, getCurrencySymbol } from '@/hooks/useUserPreferences';

interface CurrencyContextType {
  currency: string;
  symbol: string;
  primaryCurrency: string;
  primarySymbol: string;
  secondaryCurrency: string;
  secondarySymbol: string;
  exchangeRate: number;
  formatAmount: (amount: number, currencyCode?: string) => string;
  formatWithCurrency: (amount: number, currencyCode: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'PEN',
  symbol: 'S/',
  primaryCurrency: 'PEN',
  primarySymbol: 'S/',
  secondaryCurrency: 'USD',
  secondarySymbol: '$',
  exchangeRate: 3.75,
  formatAmount: (n) => `S/ ${n.toFixed(2)}`,
  formatWithCurrency: (n, c) => `${c} ${n.toFixed(2)}`,
});

export const useCurrency = () => useContext(CurrencyContext);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { prefs } = useUserPreferences();
  const symbol = getCurrencySymbol(prefs.currency);
  const primarySymbol = getCurrencySymbol(prefs.primaryCurrency);
  const secondarySymbol = getCurrencySymbol(prefs.secondaryCurrency);

  const formatAmount = (amount: number, currencyCode?: string) => {
    const sym = currencyCode ? getCurrencySymbol(currencyCode) : symbol;
    return `${sym} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatWithCurrency = (amount: number, currencyCode: string) => {
    const sym = getCurrencySymbol(currencyCode);
    return `${sym} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}
