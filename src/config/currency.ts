// Currency configuration for the entire application
export const APP_CURRENCY = 'XAF' as const;
export const CURRENCY_SYMBOL = 'FCFA';
export const CURRENCY_NAME = 'Central African CFA Franc';

export type SupportedCurrency = 'USD' | 'XAF';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  decimalPlaces: number;
  position: 'before' | 'after'; // Symbol position relative to amount
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
    position: 'before',
  },
  XAF: {
    code: 'XAF',
    symbol: 'FCFA',
    name: 'Central African CFA Franc',
    decimalPlaces: 0, // XAF doesn't use decimal places
    position: 'after',
  },
};

/**
 * Format amount according to currency configuration
 * @param amount - Amount in smallest unit (cents for USD, whole units for XAF)
 * @param currency - Currency code (defaults to app currency)
 * @param showSymbol - Whether to show currency symbol
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = APP_CURRENCY,
  showSymbol: boolean = true
): string {
  const config = CURRENCIES[currency];

  // Convert amount if needed (USD is in cents, XAF is in whole units)
  const displayAmount = currency === 'USD' ? amount / 100 : amount;

  // Format with thousand separators and appropriate decimals
  const formattedNumber = displayAmount.toLocaleString('fr-FR', {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  });

  if (!showSymbol) {
    return formattedNumber;
  }

  // Position symbol before or after based on configuration
  return config.position === 'before'
    ? `${config.symbol}${formattedNumber}`
    : `${formattedNumber} ${config.symbol}`;
}

/**
 * Format price for display on pricing page
 * Per employee pricing
 */
export function formatPricePerEmployee(
  pricePerEmployee: number,
  billingCycle: 'monthly' | 'annual',
  currency: SupportedCurrency = APP_CURRENCY
): string {
  const formatted = formatCurrency(pricePerEmployee, currency);
  const period = billingCycle === 'annual' ? '/year' : '/month';
  return `${formatted}/employee${period}`;
}

/**
 * Format total price (for multiple employees)
 */
export function formatTotalPrice(
  pricePerEmployee: number,
  employeeCount: number,
  billingCycle: 'monthly' | 'annual',
  currency: SupportedCurrency = APP_CURRENCY
): string {
  const total = pricePerEmployee * employeeCount;
  const formatted = formatCurrency(total, currency);
  const period = billingCycle === 'annual' ? '/year' : '/month';
  return `${formatted}${period}`;
}

/**
 * Convert between currencies (basic conversion, update rates as needed)
 */
const EXCHANGE_RATES: Record<string, number> = {
  'USD_TO_XAF': 600, // 1 USD = ~600 XAF (update as needed)
  'XAF_TO_USD': 1 / 600,
};

export function convertCurrency(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency
): number {
  if (fromCurrency === toCurrency) return amount;

  const rateKey = `${fromCurrency}_TO_${toCurrency}`;
  const rate = EXCHANGE_RATES[rateKey] || 1;

  return Math.round(amount * rate);
}
