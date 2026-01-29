import { useCallback, useMemo, useRef, useState } from 'react';

const DEFAULT_CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
  { value: 'CNY', label: 'CNY' },
  { value: 'JPY', label: 'JPY' },
];

/**
 * Minimal standalone-compatible currency system.
 * Matches the API shape used by the calculator content.
 */
export function useCurrencySystem(_initial = {}, options = {}) {
  const { conversionFactor = 1 } = options;

  const [price, setPriceState] = useState('');
  const [priceCurrency, setPriceCurrencyState] = useState('USD');
  const [resultCurrency, setResultCurrencyState] = useState('USD');

  const basePriceRef = useRef('');
  const basePriceCurrencyRef = useRef('USD');
  const isEquivalentConversionRef = useRef(false);

  const currencies = useMemo(() => DEFAULT_CURRENCIES, []);

  const exchangeRate = useMemo(() => {
    if (!priceCurrency || !resultCurrency || priceCurrency === resultCurrency) return 1;
    // Mock rate; keep stable and deterministic.
    return 1;
  }, [priceCurrency, resultCurrency]);

  const rateInfo = useMemo(() => {
    if (priceCurrency === resultCurrency) return null;
    return { provider: 'mock', conversionFactor };
  }, [priceCurrency, resultCurrency, conversionFactor]);

  const isResultLoading = false;

  const setPrice = useCallback((next) => {
    const str = next == null ? '' : String(next);
    setPriceState(str);
    basePriceRef.current = str;
    basePriceCurrencyRef.current = priceCurrency;
  }, [priceCurrency]);

  const setDisplayPrice = useCallback((next) => {
    // Used when calculator code performs its own conversions.
    const str = next == null ? '' : String(next);
    setPriceState(str);
  }, []);

  const setPriceCurrency = useCallback((nextCurrency) => {
    setPriceCurrencyState(nextCurrency);
    basePriceCurrencyRef.current = nextCurrency;
  }, []);

  const setResultCurrency = useCallback((nextCurrency) => {
    setResultCurrencyState(nextCurrency);
  }, []);

  const reset = useCallback(() => {
    setPriceState('');
    setPriceCurrencyState('USD');
    setResultCurrencyState('USD');
    basePriceRef.current = '';
    basePriceCurrencyRef.current = 'USD';
    isEquivalentConversionRef.current = false;
  }, []);

  const initialize = useCallback((data = {}) => {
    const nextPrice = data.price == null ? '' : String(data.price);
    const nextPriceCurrency = data.priceCurrency || 'USD';
    const nextResultCurrency = data.resultCurrency || 'USD';

    setPriceState(nextPrice);
    setPriceCurrencyState(nextPriceCurrency);
    setResultCurrencyState(nextResultCurrency);

    basePriceRef.current = nextPrice;
    basePriceCurrencyRef.current = nextPriceCurrency;
    isEquivalentConversionRef.current = false;
  }, []);

  return {
    price,
    setPrice,
    setDisplayPrice,
    priceCurrency,
    setPriceCurrency,
    resultCurrency,
    setResultCurrency,
    exchangeRate,
    rateInfo,
    isResultLoading,
    basePriceRef,
    basePriceCurrencyRef,
    isEquivalentConversionRef,
    currencies,
    reset,
    initialize,
  };
}
