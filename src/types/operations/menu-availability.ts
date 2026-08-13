export type MenuItemOperationalAvailabilityState = "Available" | "Paused";

export type MenuItemOperationalAvailabilityReasonCode =
  | "OutOfStock"
  | "EquipmentFault"
  | "QualityIssue"
  | "Cleaning"
  | "ManualPause"
  | "Other";

export interface KioskMenuItemAvailabilityResult {
  kioskId: string;
  menuId: string;
  menuItemId: string;
  displayName: string;
  menuName: string;
  catalogSellable: boolean;
  state: MenuItemOperationalAvailabilityState;
  reasonCode?: MenuItemOperationalAvailabilityReasonCode | null;
  reason?: string | null;
  revision: number;
  changedAt?: string | null;
  changedByAccountId?: string | null;
}

export interface SetKioskMenuItemAvailabilityRequest {
  state: MenuItemOperationalAvailabilityState;
  reasonCode: MenuItemOperationalAvailabilityReasonCode;
  reason: string;
  expectedRevision: number;
  requestId: string;
}
