export interface DeviceTypeResult {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  category: string;
  requiresKioskAssignment: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface DeviceModelResult {
  id: string;
  deviceTypeId: number;
  code: string;
  name: string;
  manufacturer?: string | null;
  modelNumber?: string | null;
  firmwareFamily?: string | null;
  capabilities: string[];
}

export interface DeviceTypesQuery {
  search?: string;
  isActive?: boolean;
}

export interface DeviceModelsQuery {
  search?: string;
}
