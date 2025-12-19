'use client';

import { useState } from "react";
import { useAuth } from "../../src/contexts/AuthContext";
import { usePreferences } from "../../src/contexts/PreferencesContext";
import {
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../../src/i18n/messages";

const AVATAR_FALLBACK_TEXT = "LS";

export default function AccountPage() {
  const { user, logout, logoutAll } = useAuth();
  const { theme, toggleTheme } = usePreferences();
  const [language, setLanguage] = useState<SupportedLocale>("en");

  const displayName = user?.fullName ?? user?.username ?? "Operator";
  const derivedEmail = user
    ? `${user.username}@lucky-system.io`
    : "operator@lucky-system.io";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-400">
          Account Workspace
        </p>
        <h1 className="text-3xl font-semibold text-white">Profile & Preferences</h1>
        <p className="text-sm text-slate-300">
          Manage profile photo, security, localization, and UI preferences from one
          curated console.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-orange-400/60 bg-gradient-to-br from-orange-500 to-amber-400 text-3xl font-bold text-slate-950">
              {displayName.slice(0, 2).toUpperCase() || AVATAR_FALLBACK_TEXT}
            </div>
            <p className="mt-4 text-xl font-semibold text-white">{displayName}</p>
            <p className="text-sm text-slate-400">{derivedEmail}</p>
            <div className="mt-5 flex flex-col gap-3 w-full">
              <button className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-orange-400/60 hover:bg-orange-400/10">
                Change photo
              </button>
              <button
                onClick={logout}
                className="rounded-2xl border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">Profile details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={user?.fullName ?? "—"} />
            <Field label="Username" value={user?.username ?? "—"} />
            <Field label="Email" value={derivedEmail} />
            <Field
              label="Last login"
              value={
                user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "No sessions yet"
              }
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/80 transition hover:border-orange-400/60 hover:bg-orange-400/10">
              Change password
            </button>
            <button className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/80 transition hover:border-orange-400/60 hover:bg-orange-400/10">
              Two-factor auth
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Theme & language</h2>
          <p className="mt-1 text-sm text-slate-400">
            Personalize the operator console experience.
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="font-semibold text-white">Theme</p>
                <p className="text-sm text-slate-400">
                  Current theme: {theme === "ember" ? "Ember" : "Light"}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/80 transition hover:border-orange-400/60 hover:bg-orange-400/10"
              >
                Toggle
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <label className="text-sm font-semibold text-white">
                Language
                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as SupportedLocale)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
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
              <p className="mt-2 text-xs text-slate-400">
                Localization hooks tie into the i18n resources.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Security & sessions</h2>
          <p className="mt-1 text-sm text-slate-400">
            Review active sessions, revoke access, and receive alerts.
          </p>
          <div className="mt-5 space-y-4">
            {["MacBook Pro · Chrome", "Pixel 8 · Mobile App"].map((device) => (
              <div
                key={device}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-white">{device}</p>
                  <p className="text-xs text-slate-500">Last active · just now</p>
                </div>
                <button className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-red-200/80 transition hover:border-red-500/60 hover:bg-red-500/10">
                  Revoke
                </button>
              </div>
            ))}
            <button
              onClick={logoutAll}
              className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-red-500/60 hover:bg-red-500/10"
            >
              Sign out from all devices
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
};

function Field({ label, value }: FieldProps) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
        {label}
      </span>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-base text-white">
        {value}
      </div>
    </label>
  );
}
