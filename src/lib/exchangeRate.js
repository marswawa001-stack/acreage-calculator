export async function getExchangeRate(fromCurrency, toCurrency) {
  // Standalone-friendly default: no network dependency.
  // If you want real rates, replace this with a fetch to your preferred FX provider.
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
    return { rate: 1, provider: 'mock' };
  }
  return { rate: 1, provider: 'mock' };
}
