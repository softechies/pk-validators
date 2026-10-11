import { describe, expect, it } from 'vitest';
import {
  cnicGender,
  cnicProvince,
  formatCnic,
  formatIban,
  formatMobile,
  formatNtn,
  isValidCnic,
  isValidIban,
  isValidMobile,
  isValidNtn,
  isValidPostalCode,
  isValidStrn,
  maskCnic,
  parseIban,
  parseMobile,
  parseNtn,
  toLatinDigits,
  toUrduDigits,
} from '../src/index.js';

describe('CNIC', () => {
  it.each(['34201-0891231-8', '3420108912318', ' 42201 0397640 8 ', '61101-1234567-3'])('accepts %s', (cnic) => {
    expect(isValidCnic(cnic)).toBe(true);
  });

  it.each([
    ['too short', '34201-089123-8'],
    ['letters', '3420A-0891231-8'],
    ['unknown region 8', '84201-0891231-8'],
    ['region 0', '04201-0891231-8'],
    ['last digit 0', '34201-0891231-0'],
    ['empty', ''],
  ])('rejects %s', (_label, cnic) => {
    expect(isValidCnic(cnic)).toBe(false);
  });

  it('formats and masks', () => {
    expect(formatCnic('3420108912318')).toBe('34201-0891231-8');
    expect(maskCnic('3420108912318')).toBe('34201-*******-8');
    expect(formatCnic('123')).toBeNull();
  });

  it('reads province and gender', () => {
    expect(cnicProvince('42201-0397640-8')).toBe('Sindh');
    expect(cnicGender('42201-0397640-8')).toBe('female');
    expect(cnicProvince('35202-1234567-1')).toBe('Punjab');
    expect(cnicGender('35202-1234567-1')).toBe('male');
    expect(cnicProvince('71501-1234567-5')).toBe('Gilgit-Baltistan');
  });
});

describe('NTN and STRN', () => {
  it('parses company NTNs with and without the check digit', () => {
    expect(parseNtn('1234567-8')).toEqual({ kind: 'ntn', value: '12345678', formatted: '1234567-8' });
    expect(formatNtn('12345678')).toBe('1234567-8');
    expect(formatNtn('1234567')).toBe('1234567');
  });

  it('accepts a CNIC as an individual NTN', () => {
    expect(parseNtn('3520212345671')).toEqual({ kind: 'cnic', value: '3520212345671', formatted: '35202-1234567-1' });
  });

  it('rejects other shapes', () => {
    expect(isValidNtn('123456')).toBe(false);
    expect(isValidNtn('1234567-89')).toBe(false);
    expect(isValidNtn('abc')).toBe(false);
  });

  it('checks STRN length', () => {
    expect(isValidStrn('32-77-8761-234-56')).toBe(true);
    expect(isValidStrn('3277876123456')).toBe(true);
    expect(isValidStrn('327787612345')).toBe(false);
  });
});

describe('mobile numbers', () => {
  it.each([
    '03001234567',
    '0300-1234567',
    '0300 1234567',
    '+92 300 1234567',
    '+923001234567',
    '00923001234567',
    '923001234567',
    '3001234567',
    '+92 (0)300 1234567',
    '(0300) 123-4567',
  ])('reads %s', (input) => {
    expect(parseMobile(input)?.national).toBe('03001234567');
  });

  it('gives every format', () => {
    expect(parseMobile('0321-7654321')).toEqual({
      national: '03217654321',
      e164: '+923217654321',
      international: '+92 321 7654321',
      digits: '923217654321',
      network: 'Jazz',
    });
    expect(formatMobile('+923331234567', 'dashed')).toBe('0333-1234567');
  });

  it.each([
    ['0300', 'Jazz'],
    ['0315', 'Zong'],
    ['0333', 'Ufone'],
    ['0345', 'Telenor'],
    ['0355', 'SCO'],
  ])('%s is %s', (prefix, network) => {
    expect(parseMobile(`${prefix}1234567`)?.network).toBe(network);
  });

  it.each(['021-35123456', '0300123456', '030012345678', '+1 415 555 0100', '04212345678', ''])('rejects %s', (input) => {
    expect(isValidMobile(input)).toBe(false);
  });

  it('works with Urdu digits after conversion', () => {
    expect(isValidMobile(toLatinDigits('۰۳۰۰۱۲۳۴۵۶۷'))).toBe(true);
  });
});

describe('IBAN', () => {
  it('validates the checksum and finds the bank', () => {
    expect(parseIban('PK36 SCBL 0000 0011 2345 6702')).toEqual({
      iban: 'PK36SCBL0000001123456702',
      formatted: 'PK36 SCBL 0000 0011 2345 6702',
      bankCode: 'SCBL',
      bankName: 'Standard Chartered Bank (Pakistan)',
      account: '0000001123456702',
    });
    expect(parseIban('pk72habb0012345678901234')?.bankName).toBe('Habib Bank (HBL)');
  });

  it('rejects a wrong check digit, wrong length or another country', () => {
    expect(isValidIban('PK37SCBL0000001123456702')).toBe(false);
    expect(isValidIban('PK36SCBL000000112345670')).toBe(false);
    expect(isValidIban('GB82WEST12345698765432')).toBe(false);
  });

  it('formats in groups of four', () => {
    expect(formatIban('PK36SCBL0000001123456702')).toBe('PK36 SCBL 0000 0011 2345 6702');
  });
});

describe('digits and postal codes', () => {
  it('converts digits both ways', () => {
    expect(toUrduDigits('Rs 1,250')).toBe('Rs ۱,۲۵۰');
    expect(toLatinDigits('۱۲۳ and ٤٥٦')).toBe('123 and 456');
  });

  it('checks postal codes', () => {
    expect(isValidPostalCode('75500')).toBe(true);
    expect(isValidPostalCode('05500')).toBe(false);
    expect(isValidPostalCode('7550')).toBe(false);
  });
});
