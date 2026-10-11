const URDU_DIGITS = '۰۱۲۳۴۵۶۷۸۹'; // Extended Arabic-Indic, used for Urdu
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'; // Arabic-Indic

/** "Rs 1,250" → "Rs ۱,۲۵۰" */
export function toUrduDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => URDU_DIGITS[Number(d)]!);
}

/**
 * Converts Urdu and Arabic digits back to 0-9. Run user input through this before validating,
 * since phones with an Urdu keyboard often type ۰۳۰۰ instead of 0300.
 */
export function toLatinDigits(input: string): string {
  return String(input ?? '').replace(/[۰-۹٠-٩]/g, (d) => {
    const urdu = URDU_DIGITS.indexOf(d);
    return String(urdu >= 0 ? urdu : ARABIC_DIGITS.indexOf(d));
  });
}

/** Pakistan Post postal codes are five digits and never start with 0. */
export function isValidPostalCode(input: string): boolean {
  return /^[1-9]\d{4}$/.test(String(input ?? '').trim());
}
