import { createContext, useContext, useState } from 'react';

const CURRENCIES = [
  { code: 'USD', symbol: '$',  rate: 1 },
  { code: 'FRW', symbol: 'FRw', rate: 1320 },
  { code: 'EUR', symbol: '€',  rate: 0.92 },
  { code: 'GBP', symbol: '£',  rate: 0.79 },
  { code: 'JPY', symbol: '¥',  rate: 157 },
  { code: 'CAD', symbol: 'C$', rate: 1.36 },
  { code: 'AUD', symbol: 'A$', rate: 1.53 },
  { code: 'CNY', symbol: '¥',  rate: 7.25 },
];

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currencyCode, setCurrencyCode] = useState(
    () => localStorage.getItem('mc-currency') || 'USD'
  );

  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  const setCurrency = code => {
    localStorage.setItem('mc-currency', code);
    setCurrencyCode(code);
  };

  const format = (usdPrice) => {
    const converted = Number(usdPrice) * currency.rate;
    if (currency.code === 'JPY' || currency.code === 'FRW') {
      return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${currency.symbol}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, currencies: CURRENCIES, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
