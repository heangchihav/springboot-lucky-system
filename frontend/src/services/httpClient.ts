"use client";

import { API_BASE_URL } from "@/config/env";

export interface AuthenticatedRequestInit extends RequestInit {
  skipAuthRefresh?: boolean;
}

type RefreshHandler = () => Promise<unknown>;

let refreshTokenHandler: RefreshHandler | null = null;
let refreshPromise: Promise<void> | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function configureHttpClient(handler: RefreshHandler) {
  refreshTokenHandler = handler;
}

export function registerUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

export function unregisterUnauthorizedHandler(handler?: () => void) {
  if (!handler || unauthorizedHandler === handler) {
    unauthorizedHandler = null;
  }
}

async function ensureRefreshed(): Promise<void> {
  if (!refreshTokenHandler) {
    throw new Error("Refresh token handler has not been registered");
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      await refreshTokenHandler?.();
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: AuthenticatedRequestInit = {},
): Promise<Response> {
  const { skipAuthRefresh, ...restInit } = init;
  const finalInit: RequestInit = {
    credentials: restInit.credentials ?? "include",
    ...restInit,
  };

  let response = await fetch(input, finalInit);

  if (response.status === 401 && skipAuthRefresh !== true) {
    try {
      await ensureRefreshed();
      response = await fetch(input, finalInit);
    } catch {
      // If refresh throws, fall through so callers can handle the 401
    }

    if (response.status === 401) {
      unauthorizedHandler?.();
    }
  }

  return response;
}

export async function apiFetch(
  path: string,
  init: AuthenticatedRequestInit = {},
  absolute = false,
): Promise<Response> {
  const url = absolute
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  return fetchWithAuth(url, init);
}
