/**
 * Pakistani IBAN: 24 characters, PKkk BBBB AAAA AAAA AAAA AAAA
 *   PK    country
 *   kk    check digits (ISO 13616 mod 97)
 *   BBBB  bank code, the first four letters of the bank's SWIFT/BIC
 *   A×16  account number, zero padded by the bank
 */

/** Bank codes from the State Bank of Pakistan BIC list and the banks' own published IBANs. */
export const PK_BANK_CODES: Readonly<Record<string, string>> = {
  ABPA: 'Allied Bank',
  ALFH: 'Bank Alfalah',
  ASCM: 'Askari Bank',
  BAHL: 'Bank AL Habib',
  BKIP: 'BankIslami Pakistan',
  BPUN: 'The Bank of Punjab',
  DUIB: 'Dubai Islamic Bank Pakistan',
  FAYS: 'Faysal Bank',
  HABB: 'Habib Bank (HBL)',
  JSBL: 'JS Bank',
  KHYB: 'The Bank of Khyber',
  MEZN: 'Meezan Bank',
  MPBL: 'Habib Metropolitan Bank',
  MUCB: 'MCB Bank',
  NBPA: 'National Bank of Pakistan',
  SAMB: 'Samba Bank',
  SCBL: 'Standard Chartered Bank (Pakistan)',
  SONE: 'Soneri Bank',
  UNIL: 'United Bank (UBL)',
};

export interface ParsedIban {
  /** PK36SCBL0000001123456702 */
  iban: string;
  /** PK36 SCBL 0000 0011 2345 6702 */
  formatted: string;
  bankCode: string;
  /** Bank name when the code is in {@link PK_BANK_CODES}. */
  bankName: string | null;
  /** The 16 character account part, including the bank's zero padding. */
  account: string;
}

export function compactIban(input: string): string {
  return String(input ?? '').replace(/[\s-]/g, '').toUpperCase();
}

/** ISO 13616 check: move the first four characters to the end, letters to numbers, mod 97 must be 1. */
export function ibanChecksumValid(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const value = ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of value) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

export function parseIban(input: string): ParsedIban | null {
  const iban = compactIban(input);
  if (!/^PK\d{2}[A-Z]{4}[0-9A-Z]{16}$/.test(iban) || !ibanChecksumValid(iban)) return null;

  const bankCode = iban.slice(4, 8);
  return {
    iban,
    formatted: iban.replace(/(.{4})/g, '$1 ').trim(),
    bankCode,
    bankName: PK_BANK_CODES[bankCode] ?? null,
    account: iban.slice(8),
  };
}

export function isValidIban(input: string): boolean {
  return parseIban(input) !== null;
}

export function formatIban(input: string): string | null {
  return parseIban(input)?.formatted ?? null;
}
