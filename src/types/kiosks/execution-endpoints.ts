export interface ExecutionEndpointCapabilityResult {
  capabilityCode: string;
  workcellCode?: string | null;
  isAvailable: boolean;
  unavailableReason?: string | null;
}

export interface ExecutionEndpointReadinessResult {
  stateRevision: number;
  readiness: string;
  activity: string;
  safety: string;
  currentCommandId?: string | null;
  physicalOutputState: string;
  faultCode?: string | null;
  executorReportedAt: string;
  capabilities: ExecutionEndpointCapabilityResult[];
}

export interface ExecutionEndpointRobotTargetResult {
  id: string;
  runtimeTargetCode: string;
  machineModelCode: string;
  deviceId?: string | null;
  deviceCode?: string | null;
  deviceName?: string | null;
}

export interface ExecutionEndpointResult {
  id: string;
  kioskId: string;
  kioskCode: string;
  endpointCode: string;
  executionProfile: ExecutionProfile;
  authenticationMode: "MutualTls" | "SignedCommandTls";
  status: ExecutionEndpointStatus;
  readiness?: ExecutionEndpointReadinessResult | null;
  provisionedAt?: string | null;
  supportedRobotTargets: ExecutionEndpointRobotTargetResult[];
}

export type ExecutionProfile = "FullEdge" | "LowCostController";
export type ExecutionEndpointStatus =
  | "Provisioning"
  | "Active"
  | "Disabled"
  | "Retired";

export interface CreateExecutionEndpointRequest {
  endpointCode: string;
  executionProfile: ExecutionProfile;
}

export interface ReplaceExecutionEndpointRobotTargetsRequest {
  targets: Array<{
    runtimeTargetCode: string;
    machineModelCode: string;
    deviceId?: string | null;
  }>;
}

export interface ProvisionExecutionEndpointRequest {
  profileIdentity: string;
  clientCertificateSha256Fingerprint?: string | null;
  ecdsaPublicKeyPem?: string | null;
}

export interface ExecutionEndpointCredentialRotationResult {
  endpointId: string;
  kioskId: string;
  executionProfile: ExecutionProfile;
  authenticationMode: "MutualTls" | "SignedCommandTls";
  status: ExecutionEndpointStatus;
}
