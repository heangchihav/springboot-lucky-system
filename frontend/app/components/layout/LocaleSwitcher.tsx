'use client';

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../../../src/i18n/messages";

const DEFAULT_LOCALE: SupportedLocale = "en";

const isSupportedLocale = (value: string | undefined): value is SupportedLocale =>
  Boolean(value && SUPPORTED_LOCALES.includes(value as SupportedLocale));

type LocaleSwitcherProps = {
  label?: string;
  compact?: boolean;
};

export function LocaleSwitcher({ label = "Language", compact }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentLocale = useMemo(
    () => {
      const paramLocale = searchParams?.get("lang") ?? undefined;
      if (isSupportedLocale(paramLocale)) {
        return paramLocale;
      }
      return DEFAULT_LOCALE;
    },
    [searchParams]
  );

  useEffect(() => {
    document.documentElement.lang = currentLocale;
  }, [currentLocale]);

  const handleChange = useCallback(
    (nextLocale: SupportedLocale) => {
      if (nextLocale === currentLocale) return;
      const params = new URLSearchParams(searchParams?.toString());
      if (nextLocale === DEFAULT_LOCALE) {
        params.delete("lang");
      } else {
        params.set("lang", nextLocale);
      }
      const query = params.toString();
      const nextPath = `${pathname ?? "/"}${query ? `?${query}` : ""}`;
      router.replace(nextPath, { scroll: false });
    },
    [currentLocale, pathname, router, searchParams]
  );

  return (
    <label className={`flex flex-col text-xs font-semibold text-amber-200/80 ${compact ? "min-w-[7rem]" : "w-full max-w-[10rem]"}`}>
      <span className="mb-1 uppercase tracking-[0.3em]">{label}</span>
      <select
        value={currentLocale}
        onChange={(event) => handleChange(event.target.value as SupportedLocale)}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white outline-none transition-all duration-200 ease-out hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        {SUPPORTED_LOCALES.map((localeOption) => (
          <option
            key={localeOption}
            value={localeOption}
            className="bg-slate-900 text-white"
          >
            {localeOption.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
