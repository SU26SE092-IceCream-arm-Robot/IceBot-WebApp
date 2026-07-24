"use client";

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
  getAuthRestoreErrorMessage,
  isInvalidAuthSessionError,
} from "@/lib/auth-errors";
import {
  getCurrentAccount,
  getCurrentAccountAccess,
  loginWithPassword,
  refreshAccessToken,
  revokeRefreshToken,
  type LoginRequest,
} from "@/lib/services/auth";
import type { AuthSession, DashboardUser } from "@/types";
import type { EffectiveAccessResult } from "@/types/accounts";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "forbidden"
  | "unauthenticated"
  | "error";

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  currentUser: DashboardUser | null;
  effectiveAccess: EffectiveAccessResult | null;
  errorMessage: string | null;
  retryRestore: () => Promise<void>;
  login: (request: LoginRequest) => Promise<DashboardUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

class SessionValidationUnavailableError extends Error {
  constructor(
    readonly retainedSession: AuthSession,
    readonly reason: unknown,
  ) {
    super("Session validation is temporarily unavailable.");
    this.name = "SessionValidationUnavailableError";
  }
}

async function validateStoredSession(session: AuthSession): Promise<AuthSession> {
  try {
    const account = await getCurrentAccount(session.accessToken);
    return updateSessionAccount(session, account);
  } catch (error) {
    if (!isInvalidAuthSessionError(error)) {
      throw error;
    }

    const refreshedSession = await refreshAccessToken(session.refreshToken);
    try {
      const account = await getCurrentAccount(refreshedSession.accessToken);
      return updateSessionAccount(refreshedSession, account);
    } catch (refreshValidationError) {
      if (isInvalidAuthSessionError(refreshValidationError)) {
        throw refreshValidationError;
      }

      throw new SessionValidationUnavailableError(
        refreshedSession,
        refreshValidationError,
      );
    }
  }
}

async function loadEffectiveAccess(
  accessToken: string,
): Promise<EffectiveAccessResult | null> {
  try {
    return await getCurrentAccountAccess(accessToken);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [effectiveAccess, setEffectiveAccess] =
    useState<EffectiveAccessResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const applySession = useCallback((
    nextSession: AuthSession | null,
    nextAccess?: EffectiveAccessResult | null,
  ) => {
    setSession(nextSession);
    setErrorMessage(null);

    if (!nextSession) {
      setEffectiveAccess(null);
      setStatus("unauthenticated");
      return;
    }

    if (nextAccess !== undefined) {
      setEffectiveAccess(nextAccess);
    } else {
      setEffectiveAccess((currentAccess) =>
        currentAccess?.accountId === nextSession.account.id
          ? currentAccess
          : null,
      );
    }

    setStatus(mapAccountToDashboardUser(nextSession.account) ? "authenticated" : "forbidden");
  }, []);

  const restoreSession = useCallback(async () => {
    const storedSession = readAuthSession();
    if (!storedSession) {
      applySession(null);
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const validatedSession = await validateStoredSession(storedSession);
      const access = await loadEffectiveAccess(validatedSession.accessToken);
      writeAuthSession(validatedSession);
      applySession(validatedSession, access);
    } catch (error) {
      if (isInvalidAuthSessionError(error)) {
        clearAuthSession();
        applySession(null);
        return;
      }

      const retainedSession =
        error instanceof SessionValidationUnavailableError
          ? error.retainedSession
          : storedSession;
      if (error instanceof SessionValidationUnavailableError) {
        // A successful refresh rotates the refresh token. Keep its replacement
        // even when the follow-up account request is temporarily unavailable.
        writeAuthSession(retainedSession);
      }
      setSession(retainedSession);
      setEffectiveAccess(null);
      setStatus("error");
      setErrorMessage(
        getAuthRestoreErrorMessage(
          error instanceof SessionValidationUnavailableError
            ? error.reason
            : error,
        ),
      );
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
      const access = await loadEffectiveAccess(authenticatedSession.accessToken);
      writeAuthSession(authenticatedSession);
      applySession(authenticatedSession, access);
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
      effectiveAccess,
      errorMessage,
      retryRestore: restoreSession,
      login,
      logout,
    }),
    [
      currentUser,
      effectiveAccess,
      errorMessage,
      login,
      logout,
      restoreSession,
      session,
      status,
    ],
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
