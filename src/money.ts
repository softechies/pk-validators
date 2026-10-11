export type Grouping = 'international' | 'lakh';

export interface FormatPkrOptions {
  /** Prefix shown before the amount. Default "Rs". Use "" for none. */
  symbol?: string;
  /** international: 1,234,567   lakh: 12,34,567. Default international. */
  grouping?: Grouping;
  /** Decimal places. Default 2. Use 0 for whole rupees. */
  decimals?: number;
}

/**
 * formatPkr(1234567.5)                        → "Rs 1,234,567.50"
 * formatPkr(1234567.5, { grouping: 'lakh' })  → "Rs 12,34,567.50"
 * formatPkr(-2500, { decimals: 0 })           → "-Rs 2,500"
 */
export function formatPkr(amount: number, options: FormatPkrOptions = {}): string {
  const { symbol = 'Rs', grouping = 'international', decimals = 2 } = options;
  if (!Number.isFinite(amount)) throw new RangeError('Amount must be a finite number');

  const negative = amount < 0;
  const fixed = roundHalfUp(Math.abs(amount), decimals).toFixed(decimals);
  const [whole, fraction] = fixed.split('.') as [string, string | undefined];

  const grouped = grouping === 'lakh' ? groupLakh(whole) : whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const body = fraction ? `${grouped}.${fraction}` : grouped;
  const withSymbol = symbol ? `${symbol} ${body}` : body;
  return negative && Number(fixed) !== 0 ? `-${withSymbol}` : withSymbol;
}

function groupLakh(whole: string): string {
  if (whole.length <= 3) return whole;
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** Rounds half away from zero at the given decimals, avoiding the 1.005 → 1.00 float trap. */
export function roundHalfUp(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.sign(value) * Math.round(Number((Math.abs(value) * factor).toPrecision(15))) / factor;
}

// ---------------------------------------------------------------------------
// Amount in words
// ---------------------------------------------------------------------------

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/** South Asian scale used on Pakistani cheques and invoices. */
const LAKH_SCALE: Array<[bigint, string]> = [
  [100_000_000_000n, 'Kharab'],
  [1_000_000_000n, 'Arab'],
  [10_000_000n, 'Crore'],
  [100_000n, 'Lakh'],
  [1_000n, 'Thousand'],
];

const INTERNATIONAL_SCALE: Array<[bigint, string]> = [
  [1_000_000_000_000n, 'Trillion'],
  [1_000_000_000n, 'Billion'],
  [1_000_000n, 'Million'],
  [1_000n, 'Thousand'],
];

export interface AmountInWordsOptions {
  /** lakh: Lakh, Crore, Arab, Kharab. international: Million, Billion. Default lakh. */
  system?: Grouping;
  /** Word before the rupee amount. Default "Rupees". Use "" to leave it out. */
  currency?: string;
  /** Word for the fraction. Default "Paisa". */
  subunit?: string;
  /** Word at the end. Default "Only". Use "" to leave it out. */
  suffix?: string;
}

/** Spells out a whole number: 1250000 → "Twelve Lakh Fifty Thousand". */
export function numberToWords(value: number | bigint, system: Grouping = 'lakh'): string {
  let n = BigInt(value);
  if (n === 0n) return 'Zero';
  if (n < 0n) return `Minus ${numberToWords(-n, system)}`;

  const scale = system === 'lakh' ? LAKH_SCALE : INTERNATIONAL_SCALE;
  const top = scale[0]!;
  const parts: string[] = [];

  // Anything above the largest unit repeats it: 5 Kharab = "Five Kharab", 500 Kharab = "Five Hundred Kharab"
  if (n >= top[0] * (system === 'lakh' ? 100n : 1000n)) {
    parts.push(`${numberToWords(n / top[0], system)} ${top[1]}`);
    n %= top[0];
  }

  for (const [unit, name] of scale) {
    if (n >= unit) {
      parts.push(`${belowThousand(Number(n / unit))} ${name}`);
      n %= unit;
    }
  }
  if (n > 0n) parts.push(belowThousand(Number(n)));
  return parts.join(' ');
}

function belowThousand(n: number): string {
  const words: string[] = [];
  if (n >= 100) {
    words.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    words.push(TENS[Math.floor(n / 10)]!);
    n %= 10;
  }
  if (n > 0) words.push(ONES[n]!);
  return words.join(' ');
}

/**
 * amountInWords(125050.5)
 *   → "Rupees One Lakh Twenty Five Thousand Fifty and Fifty Paisa Only"
 * amountInWords(2500000, { system: 'international' })
 *   → "Rupees Two Million Five Hundred Thousand Only"
 */
export function amountInWords(amount: number, options: AmountInWordsOptions = {}): string {
  const { system = 'lakh', currency = 'Rupees', subunit = 'Paisa', suffix = 'Only' } = options;
  if (!Number.isFinite(amount)) throw new RangeError('Amount must be a finite number');
  if (Math.abs(amount) > Number.MAX_SAFE_INTEGER / 100) throw new RangeError('Amount is too large to convert exactly');

  const negative = amount < 0;
  const totalPaisa = Math.round(roundHalfUp(Math.abs(amount), 2) * 100);
  const rupees = Math.floor(totalPaisa / 100);
  const paisa = totalPaisa % 100;

  const parts: string[] = [];
  if (negative && totalPaisa > 0) parts.push('Minus');

  // "Fifty Paisa Only" reads better than "Rupees Fifty Paisa Only"
  if (rupees > 0 || paisa === 0) {
    if (currency) parts.push(currency);
    parts.push(numberToWords(rupees, system));
  }
  if (paisa > 0) {
    if (rupees > 0) parts.push('and');
    parts.push(`${numberToWords(paisa, system)} ${subunit}`);
  }
  if (suffix) parts.push(suffix);
  return parts.join(' ');
}
