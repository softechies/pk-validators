/**
 * CNIC: Computerised National Identity Card number issued by NADRA.
 * 13 digits, written as 12345-1234567-1.
 *   digit 1      province or region
 *   digits 1-5   locality
 *   digits 6-12  serial number
 *   digit 13     odd for male, even for female (0 is not issued)
 */

export type Province =
  | 'Khyber Pakhtunkhwa'
  | 'FATA'
  | 'Punjab'
  | 'Sindh'
  | 'Balochistan'
  | 'Islamabad'
  | 'Gilgit-Baltistan';

const PROVINCES: Record<string, Province> = {
  '1': 'Khyber Pakhtunkhwa',
  '2': 'FATA',
  '3': 'Punjab',
  '4': 'Sindh',
  '5': 'Balochistan',
  '6': 'Islamabad',
  '7': 'Gilgit-Baltistan',
};

/** Strips spaces and dashes. Returns the 13 digits, or null if the input can't be a CNIC. */
export function compactCnic(input: string): string | null {
  const digits = String(input ?? '').replace(/[\s-]/g, '');
  return /^\d{13}$/.test(digits) ? digits : null;
}

export function isValidCnic(input: string): boolean {
  const cnic = compactCnic(input);
  return cnic !== null && cnic[0]! in PROVINCES && cnic[12] !== '0';
}

/** 3520212345671 → 35202-1234567-1. Returns null for anything that isn't a valid CNIC. */
export function formatCnic(input: string): string | null {
  if (!isValidCnic(input)) return null;
  const c = compactCnic(input)!;
  return `${c.slice(0, 5)}-${c.slice(5, 12)}-${c.slice(12)}`;
}

/** Province or region the CNIC was issued for, from its first digit. */
export function cnicProvince(input: string): Province | null {
  return isValidCnic(input) ? PROVINCES[compactCnic(input)![0]!]! : null;
}

/** Gender recorded on the card, from the last digit (odd male, even female). */
export function cnicGender(input: string): 'male' | 'female' | null {
  if (!isValidCnic(input)) return null;
  return Number(compactCnic(input)![12]) % 2 === 1 ? 'male' : 'female';
}

/** Hides the middle of a CNIC for display or logs: 35202-*******-1 */
export function maskCnic(input: string): string | null {
  const formatted = formatCnic(input);
  return formatted ? `${formatted.slice(0, 6)}*******${formatted.slice(13)}` : null;
}
