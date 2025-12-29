'use client';

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MENU_SECTIONS,
  type MenuSection,
  type SubMenuItem,
} from "./menuConfig";
import { useAuth } from "../../../src/contexts/AuthContext";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useCurrentLocale, withLocaleQuery } from "../../../src/i18n/useLocale";

type AppShellProps = {
  children: ReactNode;
};

type TabItem = {
  path: string;
  label: string;
  sectionId: string;
};

const deriveSectionId = (pathname: string | null, accessibleSections: MenuSection[]): string => {
  if (!pathname) {
    return accessibleSections[0]?.id ?? "";
  }
  const found = accessibleSections.find((section) =>
    pathname.startsWith(`/${section.id}`)
  );
  return found?.id ?? accessibleSections[0]?.id ?? "";
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, dictionary, t } = useCurrentLocale();
  const { user, logout, isAuthenticated, isLoading, getAccessibleServices, hasPermission } = useAuth();
  
  const [permittedItems, setPermittedItems] = useState<Set<string>>(new Set());

  // Filter menu sections based on user's service access and permissions
  const accessibleSections = useMemo(() => {
    if (!isAuthenticated || !user) {
      return [];
    }
    
    const accessibleServiceIds = getAccessibleServices();
    return MENU_SECTIONS
      .filter(section => accessibleServiceIds.includes(section.id))
      .map(section => ({
        ...section,
        items: section.items.filter(item => 
          !item.requiredPermission || permittedItems.has(item.id)
        ),
      }))
      .filter(section => section.items.length > 0);
  }, [isAuthenticated, user, getAccessibleServices, permittedItems]);

  useEffect(() => {
    const runPermissionChecks = async () => {
      if (!isAuthenticated || !user) {
        setPermittedItems(new Set());
        return;
      }

      // Root user sees all items
      if (user.username === "root") {
        const allItemIds = new Set(
          MENU_SECTIONS.flatMap(section => section.items.map(item => item.id))
        );
        setPermittedItems(allItemIds);
        return;
      }

      const permissionsToCheck: Record<string, string> = {};
      MENU_SECTIONS.forEach(section => {
        section.items.forEach(item => {
          if (item.requiredPermission) {
            permissionsToCheck[item.id] = item.requiredPermission;
          }
        });
      });

      const entries = Object.entries(permissionsToCheck);
      const results = await Promise.all(
        entries.map(async ([itemId, permissionCode]) => {
          const allowed = await hasPermission(permissionCode);
          return allowed ? itemId : null;
        })
      );

      setPermittedItems(new Set(results.filter((id): id is string => Boolean(id))));
    };

    runPermissionChecks();
  }, [isAuthenticated, user, hasPermission]);
  
  const resolvedItems = useMemo(
    () =>
      accessibleSections.flatMap((section) =>
        section.items.map((item) => ({
          ...item,
          sectionId: section.id,
        }))
      ),
    [accessibleSections]
  );
  const [activeSectionId, setActiveSectionId] = useState(() =>
    deriveSectionId(pathname, accessibleSections)
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [activeTabPath, setActiveTabPath] = useState(pathname ?? "");

  const findItemByPath = useCallback(
    (path: string | null) => {
      if (!path) return undefined;
      return resolvedItems.find((item) => path.startsWith(item.path));
    },
    [resolvedItems]
  );

  const upsertTabForPath = useCallback(
    (path: string | null) => {
      const match = findItemByPath(path);
      if (!match) {
        return;
      }
      setTabs((prev) => {
        if (prev.some((tab) => tab.path === match.path)) {
          return prev;
        }
        return [
          ...prev,
          { path: match.path, label: match.label, sectionId: match.sectionId },
        ];
      });
    },
    [findItemByPath]
  );

  useEffect(() => {
    setActiveSectionId(deriveSectionId(pathname, accessibleSections));
    setMobileSidebarOpen(false);
    setActiveTabPath(pathname ?? "");
    upsertTabForPath(pathname ?? null);
  }, [pathname, accessibleSections, upsertTabForPath]);

  const activeSection: MenuSection | undefined = useMemo(
    () => accessibleSections.find((section) => section.id === activeSectionId),
    [activeSectionId, accessibleSections]
  );

  const publicAuthPaths = useMemo(() => ["/auth/login", "/auth/register"], []);

  useEffect(() => {
    if (
      !isLoading &&
      (!isAuthenticated || !user) &&
      !publicAuthPaths.includes(pathname ?? "")
    ) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, user, pathname, router, publicAuthPaths]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <span className="text-sm text-slate-400 animate-pulse">Loading session…</span>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    if (!publicAuthPaths.includes(pathname ?? "")) {
      return null;
    }

    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        sections={accessibleSections}
        activeSectionId={activeSectionId}
        activePathname={pathname ?? ""}
        onSelectSection={setActiveSectionId}
        onOpenItem={(item, sectionId) => {
          setActiveTabPath(item.path);
          setTabs((prev) => {
            if (prev.some((tab) => tab.path === item.path)) {
              return prev;
            }
            return [...prev, { path: item.path, label: item.label, sectionId }];
          });
          router.push(withLocaleQuery(item.path, locale));
        }}
      />
      <Sidebar
        sections={accessibleSections}
        activeSectionId={activeSectionId}
        onSelectSection={setActiveSectionId}
        activePathname={pathname ?? ""}
        onOpenItem={(item, sectionId) => {
          setActiveTabPath(item.path);
          setMobileSidebarOpen(false);
          setTabs((prev) => {
            if (prev.some((tab) => tab.path === item.path)) {
              return prev;
            }
            return [...prev, { path: item.path, label: item.label, sectionId }];
          });
          router.push(withLocaleQuery(item.path, locale));
        }}
        className="hidden lg:flex lg:flex-col lg:gap-10"
      />
      <main className="flex-1 border-l border-white/10 bg-slate-950/70 p-4 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-10">
          <header className="flex flex-col gap-4 border-b border-white/10 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/0 text-white transition-all duration-300 ease-out hover:border-orange-500/60 hover:bg-orange-500/10 lg:hidden"
                  aria-label="Open navigation"
                >
                  <span className="space-y-1.5">
                    <span className="block h-0.5 w-6 bg-white"></span>
                    <span className="block h-0.5 w-6 bg-white"></span>
                    <span className="block h-0.5 w-6 bg-white"></span>
                  </span>
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-amber-400">
                    {t("luckySystem")}
                  </p>
                  <h1 className="text-3xl font-semibold text-white">
                    {t("controlCenter")}
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LocaleSwitcher label={t("localeLabel")} compact />
                <AccountQuickAccess
                  name={user?.fullName ?? user?.username ?? "Operator"}
                  isAuthenticated={isAuthenticated}
                  onLogout={logout}
                />
              </div>
            </div>
            <p className="text-sm text-slate-300">
              {t("activeProgramsSubtitle")}
            </p>
          </header>
          {tabs.length > 0 ? (
            <nav className="flex flex-wrap items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              {tabs.map((tab) => {
                const isActive = activeTabPath.startsWith(tab.path);
                return (
                  <div
                    key={tab.path}
                    className={`flex items-center gap-2 rounded-2xl border px-2 py-1 ${
                      isActive
                        ? "border-orange-400/70 bg-orange-400/10 text-white"
                        : "border-white/10 bg-white/0 text-slate-300"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTabPath(tab.path);
                        router.push(withLocaleQuery(tab.path, locale));
                      }}
                      className="flex items-center gap-2 rounded-2xl px-3 py-1 text-sm font-semibold transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                      {tab.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTabs((prev) => {
                          const filtered = prev.filter(
                            (existing) => existing.path !== tab.path
                          );
                          if (filtered.length === prev.length) {
                            return prev;
                          }
                          if (activeTabPath === tab.path) {
                            const fallbackPath =
                              filtered.at(-1)?.path || resolvedItems[0]?.path || "/";
                            setActiveTabPath(fallbackPath);
                            router.push(withLocaleQuery(fallbackPath, locale));
                          }
                          return filtered;
                        });
                      }}
                      aria-label={`Close ${tab.label}`}
                      className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/70 transition-all duration-300 ease-out hover:border-orange-400/60 hover:bg-orange-400/20"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </nav>
          ) : null}
          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-orange-500/10 backdrop-blur">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}

type SidebarProps = {
  sections: MenuSection[];
  activeSectionId: string;
  activePathname: string;
  onSelectSection: (id: string) => void;
  onOpenItem: (item: SubMenuItem, sectionId: string) => void;
  className?: string;
};

function Sidebar({
  sections,
  activeSectionId,
  onSelectSection,
  activePathname,
  onOpenItem,
  className = "",
}: SidebarProps) {
  const activeSection = sections.find((section) => section.id === activeSectionId);

  return (
    <aside
      className={`w-80 flex-shrink-0 border-r border-white/10 bg-slate-950/80 ${className}`}
    >
      <div className="px-6 py-8 flex h-full flex-col gap-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-400">
            Services
          </p>
          <div className="mt-4 space-y-3">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelectSection(section.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                  section.id === activeSectionId
                    ? "border-orange-400/70 bg-orange-400/10 text-white shadow-lg shadow-orange-500/20"
                    : "border-white/10 bg-white/0 text-slate-300 hover:border-orange-400/40 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{section.label}</p>
                    <p className="text-xs text-slate-400">{section.description}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-300/70">
                    {section.items.length}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-400">
              {activeSection?.label ?? "Menu"}
            </p>
            <span className="text-[10px] uppercase tracking-[0.4em] text-slate-500">
              Modules
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {activeSection ? (
              activeSection.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  active={activePathname.startsWith(item.path)}
                  onOpen={() => onOpenItem(item, activeSectionId)}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 px-4 py-6 text-center text-sm text-slate-400">
                Select a service to see its modules.
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

type SidebarItemProps = {
  item: SubMenuItem;
  active: boolean;
  onOpen: () => void;
};

function SidebarItem({ item, active, onOpen }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 ease-out ${
        active
          ? "border-orange-400/70 bg-orange-400/10 text-white"
          : "border-white/10 bg-white/0 text-slate-300 hover:border-orange-400/40 hover:bg-white/5"
      }`}
    >
      <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
        {item.menuNumber || item.label.slice(0, 2)}
      </span>
      <div className="flex-1">
        <p className="font-semibold text-white">{item.label}</p>
        <p className="text-sm text-slate-400">{item.description}</p>
        <p className="text-[10px] uppercase tracking-[0.4em] text-orange-300/60">
          {item.path}
        </p>
      </div>
    </button>
  );
}

type MobileSidebarProps = SidebarProps & {
  open: boolean;
  onClose: () => void;
};

function MobileSidebar({ open, onClose, ...sidebarProps }: MobileSidebarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close navigation overlay"
        onClick={onClose}
      />
      <div className="relative flex h-full w-80 flex-col border-r border-white/10 bg-slate-950/95 shadow-2xl shadow-black/70">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className="text-sm font-semibold text-white">Navigation</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-sm text-white transition hover:border-orange-400/60 hover:bg-orange-400/10"
          >
            Close
          </button>
        </div>
        <Sidebar
          {...sidebarProps}
          className="flex-1 overflow-y-auto"
        />
      </div>
    </div>
  );
}

type AccountQuickAccessProps = {
  name: string;
  isAuthenticated: boolean;
  onLogout: () => Promise<void>;
};

function AccountQuickAccess({
  name,
  isAuthenticated,
  onLogout,
}: AccountQuickAccessProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    try {
      await onLogout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      router.push('/auth/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/login"
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-blue-400/60 hover:bg-blue-400/10"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-400/60 bg-gradient-to-br from-blue-500 to-blue-400">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs uppercase tracking-[0.4em] text-blue-300/80">
            Login
          </span>
          <span className="font-semibold">Sign In</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-400/60 bg-gradient-to-br from-orange-500 to-amber-400 text-base font-semibold text-slate-950">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex flex-col text-left">
        <span className="text-xs uppercase tracking-[0.4em] text-amber-300/80">
          Account
        </span>
        <span className="font-semibold">{name}</span>
      </div>
      <div className="ml-4 flex gap-2">
        <Link
          href="/account"
          className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/80 transition hover:border-orange-400/60 hover:bg-orange-400/10"
        >
          Settings
        </Link>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition ${
            isLoggingOut
              ? 'border-gray-600 bg-gray-600/20 text-gray-400 cursor-not-allowed'
              : 'border-white/10 text-amber-200/60 hover:border-red-500/70 hover:bg-red-500/10'
          }`}
        >
          {isLoggingOut ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging out...
            </span>
          ) : (
            'Logout'
          )}
        </button>
      </div>
    </div>
  );
}
