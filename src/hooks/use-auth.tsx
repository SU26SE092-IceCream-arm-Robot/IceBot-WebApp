"use client";

import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearAuthSession,
  getAuthSessionEventName,
  mapAccountToDashboardUser,
  readAuthSession,
  updateSessionAccount,
  writeAuthSession,
} from "@/lib/auth-session";
import {
  getCurrentAccount,
  loginWithPassword,
  refreshAccessToken,
  revokeRefreshToken,
  type LoginRequest,
} from "@/lib/services/auth";
import type { AuthSession, DashboardUser } from "@/types";

export type AuthStatus = "loading" | "authenticated" | "forbidden" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  currentUser: DashboardUser | null;
  login: (request: LoginRequest) => Promise<DashboardUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

async function validateStoredSession(session: AuthSession): Promise<AuthSession> {
  try {
    const account = await getCurrentAccount(session.accessToken);
    return updateSessionAccount(session, account);
  } catch (error) {
    if (!isUnauthorized(error)) {
      throw error;
    }

    const refreshedSession = await refreshAccessToken(session.refreshToken);
    const account = await getCurrentAccount(refreshedSession.accessToken);
    return updateSessionAccount(refreshedSession, account);
  }
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);

  const applySession = useCallback((nextSession: AuthSession | null) => {
    setSession(nextSession);

    if (!nextSession) {
      setStatus("unauthenticated");
      return;
    }

    setStatus(mapAccountToDashboardUser(nextSession.account) ? "authenticated" : "forbidden");
  }, []);

  const restoreSession = useCallback(async () => {
    const storedSession = readAuthSession();
    if (!storedSession) {
      applySession(null);
      return;
    }

    try {
      const validatedSession = await validateStoredSession(storedSession);
      writeAuthSession(validatedSession);
      applySession(validatedSession);
    } catch {
      clearAuthSession();
      applySession(null);
    }
  }, [applySession]);

  useEffect(() => {
    const restoreTimeoutId = window.setTimeout(() => {
      void restoreSession();
    }, 0);

    const syncSession = () => {
      applySession(readAuthSession());
    };

    const authSessionEvent = getAuthSessionEventName();
    window.addEventListener("storage", syncSession);
    window.addEventListener(authSessionEvent, syncSession);

    return () => {
      window.clearTimeout(restoreTimeoutId);
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(authSessionEvent, syncSession);
    };
  }, [applySession, restoreSession]);

  const login = useCallback(
    async (request: LoginRequest) => {
      const authenticatedSession = await loginWithPassword(request);
      writeAuthSession(authenticatedSession);
      applySession(authenticatedSession);
      return mapAccountToDashboardUser(authenticatedSession.account);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const currentSession = readAuthSession();

    try {
      if (currentSession?.refreshToken) {
        await revokeRefreshToken(currentSession.refreshToken, "Dashboard logout");
      }
    } catch {
      // Local logout must complete even when the API is unavailable.
    } finally {
      clearAuthSession();
      applySession(null);
    }
  }, [applySession]);

  const currentUser = session ? mapAccountToDashboardUser(session.account) : null;

  const value = useMemo(
    () => ({
      status,
      session,
      currentUser,
      login,
      logout,
    }),
    [currentUser, login, logout, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
