import type {
  AccountRoleScope,
  AuthenticatedAccountResult,
  AuthSession,
  AuthSessionAccount,
  CurrentAccountResult,
  DashboardRole,
  DashboardUser,
} from "@/types";

const AUTH_SESSION_STORAGE_KEY = "icebot_auth_session";
const AUTH_SESSION_EVENT = "icebot-auth-session-changed";
const ROLE_PRIORITY: readonly DashboardRole[] = ["ADMIN", "MANAGER", "LOCATION_OWNER"];

/**
 * Demo/dev strategy: browser storage keeps access and refresh tokens so the
 * capstone frontend can call the backend directly. Production should move
 * refresh tokens to HttpOnly cookies behind a BFF/session boundary.
 */
function mapBackendRole(roleCode: string): DashboardRole | null {
  if (roleCode === "SystemAdmin") {
    return "ADMIN";
  }

  if (roleCode === "Manager") {
    return "MANAGER";
  }

  if (roleCode === "OrgAdmin" || roleCode === "LocationOwner") {
    return "LOCATION_OWNER";
  }

  return null;
}

function getInitials(nameOrEmail: string): string {
  const words = nameOrEmail.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "IB";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function isStoredSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<AuthSession>;
  return (
    typeof session.accessToken === "string" &&
    typeof session.refreshToken === "string" &&
    typeof session.account === "object" &&
    session.account !== null &&
    Array.isArray(session.account.roles)
  );
}

export function getAuthSessionEventName(): string {
  return AUTH_SESSION_EVENT;
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as unknown;
    return isStoredSession(session) ? session : null;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent<AuthSession>(AUTH_SESSION_EVENT, { detail: session }));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent<null>(AUTH_SESSION_EVENT, { detail: null }));
}

export function getStoredAccessToken(): string | null {
  return readAuthSession()?.accessToken ?? null;
}

export function createSessionFromLogin(result: AuthenticatedAccountResult): AuthSession {
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    account: {
      id: result.id,
      userName: result.userName,
      fullName: result.fullName,
      email: result.email,
      imageUrl: result.imageUrl,
      roles: result.roles,
      status: result.status,
      localLoginEnabled: result.localLoginEnabled,
      googleLoginEnabled: result.googleLoginEnabled,
    },
  };
}

export function updateSessionAccount(
  session: AuthSession,
  account: CurrentAccountResult,
): AuthSession {
  return {
    ...session,
    account: {
      id: account.id,
      userName: account.userName,
      fullName: account.fullName,
      email: account.email,
      imageUrl: account.imageUrl,
      roles: account.roles,
      status: account.status,
      localLoginEnabled: account.localLoginEnabled,
      googleLoginEnabled: account.googleLoginEnabled,
    },
  };
}

export function resolveDashboardRole(roles: AccountRoleScope[]): DashboardRole | null {
  const mappedRoles = roles
    .map((roleScope) => mapBackendRole(roleScope.roleCode))
    .filter((role): role is DashboardRole => role !== null);

  return ROLE_PRIORITY.find((role) => mappedRoles.includes(role)) ?? null;
}

export function resolveLocationScope(roles: AccountRoleScope[]): string[] {
  // UI-only scoping until management APIs enforce scoped resource access.
  const locationIds = roles
    .filter((roleScope) => roleScope.roleCode === "LocationOwner")
    .map((roleScope) => roleScope.storeId)
    .filter((storeId): storeId is string => Boolean(storeId));

  return Array.from(new Set(locationIds));
}

export function mapAccountToDashboardUser(account: AuthSessionAccount): DashboardUser | null {
  const role = resolveDashboardRole(account.roles);
  if (!role) {
    return null;
  }

  const locationIds = resolveLocationScope(account.roles);
  const displayName = account.fullName?.trim() || account.userName;

  return {
    id: account.id,
    name: displayName,
    email: account.email,
    role,
    locationId: locationIds[0],
    locationIds,
    avatarInitials: getInitials(displayName || account.email),
  };
}
