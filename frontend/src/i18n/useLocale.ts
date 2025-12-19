'use client';

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  messages,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "./messages";

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const isSupportedLocale = (
  value: string | null | undefined
): value is SupportedLocale =>
  Boolean(value && SUPPORTED_LOCALES.includes(value as SupportedLocale));

export const withLocaleQuery = (path: string, locale: SupportedLocale) =>
  locale === DEFAULT_LOCALE ? path : `${path}?lang=${locale}`;

type Dictionary = Record<string, string>;

export function useCurrentLocale() {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const paramLocale = searchParams?.get("lang");
    const locale = isSupportedLocale(paramLocale) ? paramLocale : DEFAULT_LOCALE;
    const dictionary = (messages[locale] ?? messages[DEFAULT_LOCALE]) as Dictionary;
    const t = (key: string) => dictionary[key] ?? key;
    return { locale, dictionary, t };
  }, [searchParams]);
}
