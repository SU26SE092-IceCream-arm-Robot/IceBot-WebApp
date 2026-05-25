import type { DashboardUser, Role } from "@/types";

const ROLE_STORAGE_KEY = "icebot_dashboard_role";
const ROLE_CHANGED_EVENT = "icebot-role-changed";
const DEFAULT_ROLE: Role = "ADMIN";

const MOCK_USERS: Record<Role, DashboardUser> = {
  ADMIN: {
    id: "user-admin-001",
    name: "Admin IceBot",
    email: "admin@icebot.vn",
    role: "ADMIN",
    avatarInitials: "AD",
  },
  MANAGER: {
    id: "user-manager-001",
    name: "Manager IceBot",
    email: "manager@icebot.vn",
    role: "MANAGER",
    avatarInitials: "MG",
  },
  LOCATION_OWNER: {
    id: "user-owner-001",
    name: "Chủ điểm bán",
    email: "owner@icebot.vn",
    role: "LOCATION_OWNER",
    locationId: "LOC-001",
    locationIds: ["LOC-001", "LOC-003"],
    avatarInitials: "LO",
  },
};

function isRole(value: string): value is Role {
  return value === "ADMIN" || value === "MANAGER" || value === "LOCATION_OWNER";
}

export function getMockRole(): Role {
  if (typeof window === "undefined") {
    return DEFAULT_ROLE;
  }

  const storedRole = window.localStorage.getItem(ROLE_STORAGE_KEY);
  return storedRole && isRole(storedRole) ? storedRole : DEFAULT_ROLE;
}

export function setMockRole(role: Role): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ROLE_STORAGE_KEY, role);
  window.dispatchEvent(new CustomEvent<Role>(ROLE_CHANGED_EVENT, { detail: role }));
}

export function getMockCurrentUser(role: Role): DashboardUser {
  return MOCK_USERS[role];
}

export function getMockRoleChangedEventName(): string {
  return ROLE_CHANGED_EVENT;
}

export const MOCK_USER_BY_ROLE = MOCK_USERS;
