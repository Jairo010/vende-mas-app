/**
 * Business settings of the signed-in company (ADR 0008): its time zone, currency and VAT used
 * to be constants; now they come from `auth/me` and every sync pull. Plain module state so
 * pure utilities (dates, money) can read it without React.
 *
 * The defaults are the original single-company values (Ecuador), used until a company is known.
 */
export interface BusinessConfig {
  /** IANA zone: business days ("today", agenda) are counted in it. */
  readonly timeZone: string;
  /** BCP 47, e.g. `es-EC`. */
  readonly locale: string;
  /** ISO 4217, e.g. `USD`. */
  readonly currency: string;
  /** Default VAT as a fraction (0.15). */
  readonly defaultTaxRate: number;
}

export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  timeZone: 'America/Guayaquil',
  locale: 'es-EC',
  currency: 'USD',
  defaultTaxRate: 0.15,
};

let current: BusinessConfig = DEFAULT_BUSINESS_CONFIG;

/** A zone the device's Intl does not know would break every date: keep the previous one. */
function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function businessConfig(): BusinessConfig {
  return current;
}

/** Applies the company settings (partial: missing or invalid values keep the current ones). */
export function configureBusiness(settings: Partial<BusinessConfig>): void {
  current = {
    timeZone:
      settings.timeZone && isValidTimeZone(settings.timeZone)
        ? settings.timeZone
        : current.timeZone,
    locale: settings.locale || current.locale,
    currency: settings.currency || current.currency,
    defaultTaxRate:
      typeof settings.defaultTaxRate === 'number' && Number.isFinite(settings.defaultTaxRate)
        ? settings.defaultTaxRate
        : current.defaultTaxRate,
  };
}

/** Back to the defaults (sign-out: the next user may belong to another company). */
export function resetBusinessConfig(): void {
  current = DEFAULT_BUSINESS_CONFIG;
}
