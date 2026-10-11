import { compactCnic, isValidCnic } from './cnic.js';

/**
 * NTN: National Tax Number issued by FBR.
 * Companies and older registrations have a 7 digit number plus a check digit, written 1234567-8.
 * Individuals registered through IRIS use their 13 digit CNIC as the NTN.
 */
export type NtnKind = 'ntn' | 'cnic';

export interface ParsedNtn {
  kind: NtnKind;
  /** Digits only. */
  value: string;
  /** 1234567-8 for an NTN, 12345-1234567-1 for a CNIC. */
  formatted: string;
}

export function parseNtn(input: string): ParsedNtn | null {
  const raw = String(input ?? '').trim();
  if (!raw) return null;

  // 1234567-8, 12345678, or the older 7 digit form without the check digit
  const ntn = /^(\d{7})(?:-?(\d))?$/.exec(raw.replace(/\s/g, ''));
  if (ntn) {
    const [, base, check] = ntn;
    return check
      ? { kind: 'ntn', value: base! + check, formatted: `${base}-${check}` }
      : { kind: 'ntn', value: base!, formatted: base! };
  }

  if (isValidCnic(raw)) {
    const cnic = compactCnic(raw)!;
    return { kind: 'cnic', value: cnic, formatted: `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}` };
  }

  return null;
}

export function isValidNtn(input: string): boolean {
  return parseNtn(input) !== null;
}

export function formatNtn(input: string): string | null {
  return parseNtn(input)?.formatted ?? null;
}

/**
 * STRN: Sales Tax Registration Number, 13 digits. Often printed in groups (32-77-8761-234-56).
 * Only the shape is checked; FBR does not publish a checksum.
 */
export function isValidStrn(input: string): boolean {
  return /^\d{13}$/.test(String(input ?? '').replace(/[\s-]/g, ''));
}
