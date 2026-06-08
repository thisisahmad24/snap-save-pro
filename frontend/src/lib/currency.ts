/**
 * Currency detection and conversion utilities for SnapSave Pro.
 * Automatically detects the visitor's country/currency via geo-IP
 * and converts PKR base prices to their local currency.
 *
 * APIs used (both free, no key required):
 *   - https://ipapi.co/json/           → country code detection
 *   - https://api.exchangerate-api.com → PKR exchange rates
 */

const BASE_CURRENCY = "PKR";
const RATES_API_URL = `https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`;
const GEO_API_URL = "https://ipapi.co/json/";

/** ISO 3166-1 alpha-2 country code → ISO 4217 currency code */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", AU: "AUD", CA: "CAD", NZ: "NZD",
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", PT: "EUR", GR: "EUR", IE: "EUR",
  FI: "EUR", SK: "EUR", SI: "EUR", LU: "EUR", MT: "EUR",
  AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR",
  PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR",
  IN: "INR",
  JP: "JPY", CN: "CNY", KR: "KRW", SG: "SGD", MY: "MYR",
  TH: "THB", ID: "IDR", PH: "PHP", VN: "VND",
  NG: "NGN", ZA: "ZAR", KE: "KES", GH: "GHS", EG: "EGP",
  BR: "BRL", MX: "MXN", AR: "ARS", CO: "COP",
  TR: "TRY", RU: "RUB", UA: "UAH",
  CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN",
  HU: "HUF", CZ: "CZK", RO: "RON",
};

/** Currency symbol map */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",   EUR: "€",   GBP: "£",   INR: "₹",
  AED: "د.إ", SAR: "﷼",  QAR: "ر.ق", KWD: "د.ك",
  BHD: ".د.ب",OMR: "﷼",
  PKR: "Rs",  BDT: "৳",  LKR: "Rs",  NPR: "Rs",
  JPY: "¥",   CNY: "¥",  KRW: "₩",   SGD: "S$",  MYR: "RM",
  THB: "฿",   IDR: "Rp", PHP: "₱",   VND: "₫",
  AUD: "A$",  CAD: "C$",  NZD: "NZ$",
  NGN: "₦",   ZAR: "R",  KES: "KSh", GHS: "₵",
  BRL: "R$",  MXN: "$",  ARS: "$",   COP: "$",
  TRY: "₺",   RUB: "₽",  UAH: "₴",
  CHF: "CHF", SEK: "kr", NOK: "kr",  DKK: "kr",
  PLN: "zł",  HUF: "Ft", CZK: "Kč",  RON: "lei",
};

// ─── In-session cache (reset on page reload) ─────────────────────────────────
let _cachedRates: Record<string, number> | null = null;
let _cachedCurrency: string | null = null;

/**
 * Fetches INR exchange rates.
 * Results are cached for the lifetime of the page session.
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  if (_cachedRates) return _cachedRates;
  try {
    const res = await fetch(RATES_API_URL);
    if (!res.ok) throw new Error("Rates fetch failed");
    const data = await res.json();
    _cachedRates = (data.rates as Record<string, number>) ?? {};
    return _cachedRates;
  } catch {
    return {};
  }
}

/**
 * Detects the user's local currency using geo-IP (ipapi.co).
 * Falls back to browser Intl locale hint, then USD.
 */
export async function detectUserCurrency(): Promise<string> {
  if (_cachedCurrency) return _cachedCurrency;
  try {
    const res = await fetch(GEO_API_URL);
    if (!res.ok) throw new Error("Geo IP failed");
    const data = await res.json();
    _cachedCurrency = COUNTRY_TO_CURRENCY[data.country_code as string] ?? "USD";
  } catch {
    // Fallback: parse country code from browser locale (e.g. "en-US" → "US")
    try {
      const parts = (navigator.language ?? "en-US").split("-");
      const countryCode = parts[1]?.toUpperCase() ?? "";
      _cachedCurrency = COUNTRY_TO_CURRENCY[countryCode] ?? "USD";
    } catch {
      _cachedCurrency = "USD";
    }
  }
  return _cachedCurrency!;
}

/**
 * Converts an INR amount to the target currency using fetched rates.
 * Returns the INR amount unchanged if the currency is INR or rate not found.
 */
export function convertFromINR(
  amountINR: number,
  targetCurrency: string,
  rates: Record<string, number>
): number {
  if (targetCurrency === BASE_CURRENCY) return amountINR;
  const rate = rates[targetCurrency];
  if (!rate) return amountINR;
  return amountINR * rate;
}

/**
 * Formats a number as a currency string with the appropriate symbol
 * and sensible decimal places for that currency.
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  // Zero-decimal currencies
  if (["JPY", "KRW", "VND", "IDR", "HUF"].includes(currency)) {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  // Very small amounts (e.g. ₹1 ≈ $0.012)
  if (amount < 0.01) return `${symbol}${amount.toFixed(4)}`;
  if (amount < 1)    return `${symbol}${amount.toFixed(3)}`;
  if (amount < 100)  return `${symbol}${amount.toFixed(2)}`;
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

/** Returns just the symbol for a given currency code */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/** True when the base currency equals INR (i.e. user is in India) */
export function isBaseCurrency(currency: string): boolean {
  return currency === BASE_CURRENCY;
}
