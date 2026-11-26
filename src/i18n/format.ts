import { getLocale, intlLocale, type Locale } from './locale'

// `Intl` formatters are costly to create, so each one is built once per language and options.
const numberFormats = new Map<string, Intl.NumberFormat>()
const dateFormats = new Map<string, Intl.DateTimeFormat>()
const relativeFormats = new Map<string, Intl.RelativeTimeFormat>()

function cached<T>(cache: Map<string, T>, locale: Locale, options: object, create: (tag: string) => T): T {
  const key = `${locale}|${JSON.stringify(options)}`
  let formatter = cache.get(key)
  if (!formatter) {
    formatter = create(intlLocale(locale))
    cache.set(key, formatter)
  }
  return formatter
}

/** A number formatter for the current language (or the given one). */
export const numberFormat = (options: Intl.NumberFormatOptions = {}, locale = getLocale()) =>
  cached(numberFormats, locale, options, (tag) => new Intl.NumberFormat(tag, options))

export const dateFormat = (options: Intl.DateTimeFormatOptions, locale = getLocale()) =>
  cached(dateFormats, locale, options, (tag) => new Intl.DateTimeFormat(tag, options))

export const relativeTimeFormat = (options: Intl.RelativeTimeFormatOptions = {}, locale = getLocale()) =>
  cached(relativeFormats, locale, options, (tag) => new Intl.RelativeTimeFormat(tag, options))

/** 1284 → "1.284" (German) or "1,284" (English); at most `digits` decimals. */
export const formatNumber = (value: number, digits = 0, locale = getLocale()) =>
  numberFormat({ maximumFractionDigits: digits }, locale).format(value)

/** "62,5 kg" / "62.5 kg". */
export const formatKg = (value: number, locale = getLocale()) => `${formatNumber(value, 1, locale)} kg`

/** Sorts names alphabetically by the rules of the current language. */
export const compareText = (a: string, b: string, locale = getLocale()) => a.localeCompare(b, locale)
