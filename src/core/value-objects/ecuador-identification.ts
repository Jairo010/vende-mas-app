import type { IdentificationType } from '../types/customer.types';

/**
 * Ecuadorian identification rules (Registro Civil / SRI).
 *
 * - Cédula: 10 digits, province 01–24 (30 for Ecuadorians abroad), third digit 0–5 and a
 *   modulo-10 check digit.
 * - RUC: 13 digits.
 *   - Natural person (third digit 0–5): a valid cédula + establishment code (not `000`).
 *   - Public entity (6) and company (9): province + establishment code. Their modulo-11 check
 *     digit is NOT enforced: the SRI has issued valid company RUCs that fail it, and a false
 *     rejection would block a real sale. The billing system validates them on export.
 * - Passport: 5–20 letters or digits.
 */
const PROVINCE_ABROAD = 30;
const MAX_PROVINCE = 24;

function hasValidProvince(value: string): boolean {
  const province = Number(value.slice(0, 2));
  return (province >= 1 && province <= MAX_PROVINCE) || province === PROVINCE_ABROAD;
}

export function isValidCedula(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  if (!hasValidProvince(value)) return false;
  if (Number(value[2]) > 5) return false;

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    let product = Number(value[index]) * (index % 2 === 0 ? 2 : 1);
    if (product > 9) product -= 9;
    sum += product;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(value[9]);
}

export function isValidRuc(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  if (!hasValidProvince(value)) return false;

  const thirdDigit = Number(value[2]);
  if (thirdDigit <= 5) {
    return isValidCedula(value.slice(0, 10)) && value.slice(10) !== '000';
  }
  if (thirdDigit === 6) {
    // Public entities: 9 digits + 4-digit establishment code.
    return value.slice(9) !== '0000';
  }
  if (thirdDigit === 9) {
    return value.slice(10) !== '000';
  }
  return false;
}

export function isValidPassport(value: string): boolean {
  return /^[A-Za-z0-9]{5,20}$/.test(value);
}

export function isValidIdentification(type: IdentificationType, value: string): boolean {
  const normalized = value.trim();
  switch (type) {
    case 'CEDULA':
      return isValidCedula(normalized);
    case 'RUC':
      return isValidRuc(normalized);
    case 'PASSPORT':
      return isValidPassport(normalized);
  }
}
