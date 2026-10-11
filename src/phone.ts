/** Network a mobile prefix was originally allocated to. Numbers can be ported, so treat it as a hint. */
export type MobileNetwork = 'Jazz' | 'Zong' | 'Ufone' | 'Telenor' | 'SCO' | 'Unknown';

export interface ParsedMobile {
  /** 03001234567 */
  national: string;
  /** +923001234567 */
  e164: string;
  /** +92 300 1234567 */
  international: string;
  /** 923001234567, the format WhatsApp and most SMS gateways expect */
  digits: string;
  network: MobileNetwork;
}

/**
 * Reads any common way of writing a Pakistani mobile number:
 * 03001234567, 0300-1234567, +92 300 1234567, 0092 300 1234567, 923001234567, 3001234567, +92 (0)300 1234567
 */
export function parseMobile(input: string): ParsedMobile | null {
  const raw = String(input ?? '').trim();
  if (!raw) return null;

  const plus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');

  let subscriber: string | undefined;
  if (plus && digits.startsWith('92')) subscriber = digits.slice(2);
  else if (digits.startsWith('0092')) subscriber = digits.slice(4);
  else if (digits.startsWith('92') && (digits.length === 12 || digits.length === 13)) subscriber = digits.slice(2);
  else if (digits.startsWith('03') && digits.length === 11) subscriber = digits.slice(1);
  else if (digits.startsWith('3') && digits.length === 10) subscriber = digits;

  // +92 (0)300 1234567 leaves a trunk zero behind
  if (subscriber?.length === 11 && subscriber.startsWith('0')) subscriber = subscriber.slice(1);

  if (!subscriber || !/^3\d{9}$/.test(subscriber)) return null;

  return {
    national: `0${subscriber}`,
    e164: `+92${subscriber}`,
    international: `+92 ${subscriber.slice(0, 3)} ${subscriber.slice(3)}`,
    digits: `92${subscriber}`,
    network: networkOf(subscriber),
  };
}

export function isValidMobile(input: string): boolean {
  return parseMobile(input) !== null;
}

export type MobileFormat = 'national' | 'e164' | 'international' | 'digits' | 'dashed';

/** formatMobile('+923001234567', 'dashed') → 0300-1234567 */
export function formatMobile(input: string, format: MobileFormat = 'national'): string | null {
  const parsed = parseMobile(input);
  if (!parsed) return null;
  if (format === 'dashed') return `${parsed.national.slice(0, 4)}-${parsed.national.slice(4)}`;
  return parsed[format];
}

function networkOf(subscriber: string): MobileNetwork {
  if (subscriber.startsWith('355')) return 'SCO';
  switch (subscriber.slice(0, 2)) {
    case '30':
    case '32': // formerly Warid, merged into Jazz
      return 'Jazz';
    case '31':
      return 'Zong';
    case '33':
      return 'Ufone';
    case '34':
      return 'Telenor';
    default:
      return 'Unknown';
  }
}
