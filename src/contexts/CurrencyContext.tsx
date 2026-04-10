import React, { createContext, useContext } from 'react';
import { useUserPreferences, getCurrencySymbol } from '@/hooks/useUserPreferences';

interface CurrencyContextType {
  currency: string;
  symbol: string;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'PEN',
  symbol: 'S/',
  formatAmount: (n) => `S/ ${n.toFixed(2)}`,
});

export const useCurrency = () => useContext(CurrencyContext);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { prefs } = useUserPreferences();
  const symbol = getCurrencySymbol(prefs.currency);

  const formatAmount = (amount: number) => {
    return `${symbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency: prefs.currency, symbol, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}
