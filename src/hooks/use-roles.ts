"use client";

import { useCallback, useEffect, useState } from "react";

import { getManagementRoles, getPermissionMatrix, getRolesErrorMessage } from "@/lib/services/roles";
import type { ManagementRoleResult, PermissionMatrixResult } from "@/types/accounts";

export interface UseRolesResult {
  roles: ManagementRoleResult[];
  permissionMatrix: PermissionMatrixResult | null;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
}

export function useRoles(): UseRolesResult {
  const [roles, setRoles] = useState<ManagementRoleResult[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrixResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [rolesData, matrixData] = await Promise.all([
        getManagementRoles(signal),
        getPermissionMatrix(signal),
      ]);

      setRoles(rolesData);
      setPermissionMatrix(matrixData);
    } catch (error) {
      setErrorMessage(getRolesErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    roles,
    permissionMatrix,
    isLoading,
    errorMessage,
    refresh,
  };
}
