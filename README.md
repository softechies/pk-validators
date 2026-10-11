# pk-validators

Validate and format the Pakistani data every local app handles: **CNIC, NTN, STRN, mobile
numbers, IBAN, postal codes**, plus **PKR formatting** and **amount in words** with lakh and crore,
the way it's written on cheques and invoices.

Zero dependencies, fully typed, works in Node, browsers, React Native and edge runtimes.

[![ci](https://github.com/softechies/pk-validators/actions/workflows/ci.yml/badge.svg)](https://github.com/softechies/pk-validators/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![Dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

```ts
import { formatCnic, parseMobile, parseIban, amountInWords, formatPkr } from '@softechies/pk-validators';

formatCnic('3520212345671');           // '35202-1234567-1'
parseMobile('+92 300 1234567').national; // '03001234567'
parseIban('PK36SCBL0000001123456702')?.bankName; // 'Standard Chartered Bank (Pakistan)'
formatPkr(1234567.5, { grouping: 'lakh' }); // 'Rs 12,34,567.50'
amountInWords(125050.5);
// 'Rupees One Lakh Twenty Five Thousand Fifty and Fifty Paisa Only'
```

## Install

```bash
npm install @softechies/pk-validators
```

## CNIC

```ts
isValidCnic('34201-0891231-8');  // true   (dashes, spaces or plain digits)
formatCnic('3420108912318');     // '34201-0891231-8'
maskCnic('3420108912318');       // '34201-*******-8'   for logs and receipts
cnicProvince('42201-0397640-8'); // 'Sindh'
cnicGender('42201-0397640-8');   // 'female'
compactCnic('34201-0891231-8');  // '3420108912318'     for storing
```

Checks the 13 digit shape, the region digit (1 to 7) and the last digit (never 0). It can't tell
whether NADRA actually issued a number; for that you need NADRA's own verification service.

## NTN and STRN

```ts
parseNtn('1234567-8');     // { kind: 'ntn',  value: '12345678',      formatted: '1234567-8' }
parseNtn('3520212345671'); // { kind: 'cnic', value: '3520212345671', formatted: '35202-1234567-1' }
isValidStrn('32-77-8761-234-56'); // true
```

Individuals registered on IRIS use their CNIC as NTN, so both forms are accepted.

## Mobile numbers

```ts
parseMobile('0300-1234567');
// {
//   national: '03001234567',
//   e164: '+923001234567',
//   international: '+92 300 1234567',
//   digits: '923001234567',     // WhatsApp and SMS gateways
//   network: 'Jazz'
// }

formatMobile('923331234567', 'dashed'); // '0333-1234567'
isValidMobile('021-35123456');          // false, that's a landline
```

Reads `03001234567`, `0300-1234567`, `+92 300 1234567`, `0092...`, `92...`, `300...` and
`+92 (0)300...`. `network` is the network the prefix was originally given to; numbers can be
ported, so use it as a hint only.

## IBAN

```ts
parseIban('pk36 scbl 0000 0011 2345 6702');
// {
//   iban: 'PK36SCBL0000001123456702',
//   formatted: 'PK36 SCBL 0000 0011 2345 6702',
//   bankCode: 'SCBL',
//   bankName: 'Standard Chartered Bank (Pakistan)',
//   account: '0000001123456702'
// }
```

Validates the length, layout and ISO 13616 mod 97 check digits, so typos are caught before a
payment fails. Bank names are included for the major banks (`PK_BANK_CODES`); unknown codes still
validate and return `bankName: null`.

## Money

```ts
formatPkr(1234567.5);                                // 'Rs 1,234,567.50'
formatPkr(1234567.5, { grouping: 'lakh' });          // 'Rs 12,34,567.50'
formatPkr(2500, { symbol: 'PKR', decimals: 0 });     // 'PKR 2,500'

amountInWords(5000);       // 'Rupees Five Thousand Only'
amountInWords(0.75);       // 'Seventy Five Paisa Only'
amountInWords(2_500_000, { system: 'international' });
// 'Rupees Two Million Five Hundred Thousand Only'

numberToWords(123_456_789);
// 'Twelve Crore Thirty Four Lakh Fifty Six Thousand Seven Hundred Eighty Nine'
```

`roundHalfUp(1.005) === 1.01`, so totals on invoices don't drift because of floating point.

## Urdu digits and postal codes

```ts
toUrduDigits('Rs 1,250');        // 'Rs ۱,۲۵۰'
toLatinDigits('۰۳۰۰۱۲۳۴۵۶۷');     // '03001234567'  run input through this before validating
isValidPostalCode('75500');      // true
```

## With Zod, Yup or React Hook Form

Every check is a plain `(value: string) => boolean`, so it drops into any schema library:

```ts
import { z } from 'zod';
import { isValidCnic, isValidMobile, isValidIban } from '@softechies/pk-validators';

const customer = z.object({
  cnic: z.string().refine(isValidCnic, 'Enter a valid CNIC'),
  phone: z.string().refine(isValidMobile, 'Enter a valid mobile number'),
  iban: z.string().refine(isValidIban, 'Enter a valid IBAN').optional(),
});
```

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

## License

MIT

---

Built and maintained by [Softechies Solutions](https://softechies.net). See also our
[pk-courier-sdk](https://github.com/softechies/pk-courier-sdk) for Leopards and PostEx,
and [pk-payments-sdk](https://github.com/softechies/pk-payments-sdk) for JazzCash and Easypaisa.
