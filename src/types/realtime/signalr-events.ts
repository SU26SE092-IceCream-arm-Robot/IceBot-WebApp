export type DashboardScope = "system" | "organization" | "store";

export interface DashboardInvalidatedEvent {
  scope: DashboardScope;
  organizationId?: string | null;
  storeId?: string | null;
  reason?: string | null;
  occurredAt?: string;
}

export interface KioskStatusChangedEvent {
  kioskId: string;
  organizationId?: string | null;
  storeId?: string | null;
  oldLifecycleStatus?: string | null;
  newLifecycleStatus?: string | null;
  oldConnectivity?: string | null;
  newConnectivity?: string | null;
  occurredAt?: string;
}

export interface KioskOperationalStateChangedEvent {
  kioskId: string;
  organizationId?: string | null;
  storeId?: string | null;
  oldState?: string | null;
  newState: string;
  actor?: string | null;
  reason?: string | null;
  sourceMaintenanceTicketId?: string | null;
  occurredAt?: string;
}

export interface ExecutionReadinessChangedEvent {
  kioskId: string;
  endpointId?: string | null;
  stateRevision?: number;
  readiness: string;
  activity: string;
  safety: string;
  faultCode?: string | null;
  occurredAt?: string;
}

export interface InventoryChangedEvent {
  kioskId: string;
  dispenserStateId?: string | null;
  occurredAt?: string;
}

export interface DeviceEventCreatedEvent {
  kioskId: string;
  deviceId: string;
  eventId: string;
  eventType: string;
  severity: string;
  message?: string;
  occurredAt?: string;
}

export interface AlertChangedEvent {
  alertId: string;
  kioskId?: string | null;
  status: string;
  severity: string;
  occurredAt?: string;
}

export interface MaintenanceTicketChangedEvent {
  ticketId: string;
  kioskId?: string | null;
  status: string;
  priority?: string | null;
  assignedToAccountId?: string | null;
  occurredAt?: string;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  orderNumber?: string | null;
  oldStatus?: string | null;
  newStatus: string;
  occurredAt?: string;
}

export interface PaymentStatusChangedEvent {
  orderId: string;
  paymentTransactionId?: string | null;
  oldStatus?: string | null;
  newStatus: string;
  occurredAt?: string;
}

export interface OrderItemFulfillmentChangedEvent {
  orderId: string;
  orderItemId: string;
  kioskId?: string | null;
  fulfillmentType: string;
  oldStatus?: string | null;
  newStatus: string;
  quantity?: number;
  occurredAt?: string;
}

export interface OrderExecutionObservationChangedEvent {
  orderId: string;
  observationStatus: string;
  customerExecutionStatus?: string | null;
  customerMessage?: string | null;
  requiresStaffSupport: boolean;
  executorEvidenceTime?: string | null;
  cloudReceiveTime?: string | null;
  occurredAt?: string;
}
