import axios from "axios";

import { evaluateReadiness } from "@/lib/readiness/evaluate-readiness";
import {
  listManagementMenus,
  listManagementProducts,
} from "@/lib/services/menu-management";
import { getManagementKiosks } from "@/lib/services/kiosk-management";
import {
  getManagementOrganizationById,
  listManagementOrganizations,
} from "@/lib/services/organizations";
import { getPaymentMethods } from "@/lib/services/payments";
import {
  getManagementStoreById,
  getManagementStores,
} from "@/lib/services/stores";
import type { MenuResult, ProductResult } from "@/types/menu-management";
import type {
  ReadinessSource,
  ReadinessSourceFailure,
  SetupReadinessOrganizationOption,
  SetupReadinessResult,
  SetupReadinessScopeOptions,
  SetupReadinessStoreOption,
} from "@/types/setup-readiness";
import type { OrganizationResult } from "@/types/tenant-management";

const READINESS_PAGE_SIZE = 100;

interface GetSetupReadinessInput {
  organizationId: string;
  storeId: string;
}

function toFailure(source: ReadinessSource, error: unknown): ReadinessSourceFailure {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    const data = response?.data as
      | {
          message?: string;
          businessError?: string;
          systemError?: string;
        }
      | undefined;

    return {
      source,
      statusCode: response?.status,
      message:
        data?.message ??
        data?.businessError ??
        data?.systemError ??
        error.message ??
        "Không thể tải nguồn dữ liệu.",
    };
  }

  return {
    source,
    message: error instanceof Error ? error.message : "Không thể tải nguồn dữ liệu.",
  };
}

async function loadAllOrganizations(
  signal?: AbortSignal,
): Promise<OrganizationResult[]> {
  const organizations: OrganizationResult[] = [];
  let pageNumber = 1;
  let hasNext = true;

  while (hasNext) {
    const result = await listManagementOrganizations(
      { pageNumber, pageSize: READINESS_PAGE_SIZE },
      signal,
    );
    organizations.push(...(result.data ?? []));
    hasNext = result.pagination.hasNext;
    pageNumber += 1;
  }

  return organizations;
}

async function loadAllProducts(
  organizationId: string,
  signal?: AbortSignal,
): Promise<ProductResult[]> {
  const products: ProductResult[] = [];
  let pageNumber = 1;
  let hasNext = true;

  while (hasNext) {
    const result = await listManagementProducts(
      {
        organizationId,
        searchTerm: "",
        pageNumber,
        pageSize: READINESS_PAGE_SIZE,
      },
      signal,
    );
    products.push(...(result.data ?? []));
    hasNext = result.pagination.hasNext;
    pageNumber += 1;
  }

  return products;
}

async function loadAllMenus(
  organizationId: string,
  signal?: AbortSignal,
): Promise<MenuResult[]> {
  const menus: MenuResult[] = [];
  let pageNumber = 1;
  let hasNext = true;

  while (hasNext) {
    const result = await listManagementMenus(
      {
        organizationId,
        searchTerm: "",
        pageNumber,
        pageSize: READINESS_PAGE_SIZE,
      },
      signal,
    );
    menus.push(...(result.data ?? []));
    hasNext = result.pagination.hasNext;
    pageNumber += 1;
  }

  return menus;
}

function toOrganizationOption(
  organization: OrganizationResult,
): SetupReadinessOrganizationOption {
  return {
    id: organization.id,
    name: organization.name,
    code: organization.code,
    status: organization.status,
  };
}

function uniqueOrganizationOptions(
  organizations: SetupReadinessOrganizationOption[],
  stores: SetupReadinessStoreOption[],
) {
  const byId = new Map<string, SetupReadinessOrganizationOption>();
  for (const organization of organizations) {
    byId.set(organization.id, organization);
  }
  for (const store of stores) {
    if (!byId.has(store.organizationId)) {
      byId.set(store.organizationId, { id: store.organizationId });
    }
  }
  return Array.from(byId.values());
}

export async function getSetupReadinessScopeOptions(
  signal?: AbortSignal,
): Promise<SetupReadinessScopeOptions> {
  const [organizationsResult, storesResult] = await Promise.allSettled([
    loadAllOrganizations(signal),
    getManagementStores({}, signal),
  ]);

  const failures: ReadinessSourceFailure[] = [];
  const organizations =
    organizationsResult.status === "fulfilled"
      ? organizationsResult.value.map(toOrganizationOption)
      : [];
  if (organizationsResult.status === "rejected") {
    failures.push(toFailure("organization", organizationsResult.reason));
  }

  const stores: SetupReadinessStoreOption[] =
    storesResult.status === "fulfilled"
      ? storesResult.value.map((store) => ({
          id: store.id,
          organizationId: store.organizationId,
          name: store.name,
          code: store.code,
          status: store.status,
        }))
      : [];
  if (storesResult.status === "rejected") {
    failures.push(toFailure("store", storesResult.reason));
  }

  return {
    organizations: uniqueOrganizationOptions(organizations, stores),
    stores,
    failures,
  };
}

export async function getSetupReadiness(
  input: GetSetupReadinessInput,
  signal?: AbortSignal,
): Promise<SetupReadinessResult> {
  const { organizationId, storeId } = input;

  const [
    organizationResult,
    storeResult,
    kiosksResult,
    productsResult,
    menusResult,
    paymentMethodsResult,
  ] = await Promise.allSettled([
    getManagementOrganizationById(organizationId, signal),
    getManagementStoreById(storeId, signal),
    getManagementKiosks({ organizationId, storeId }, signal),
    loadAllProducts(organizationId, signal),
    loadAllMenus(organizationId, signal),
    getPaymentMethods(signal),
  ]);

  const failures: ReadinessSourceFailure[] = [];
  if (organizationResult.status === "rejected") {
    failures.push(toFailure("organization", organizationResult.reason));
  }
  if (storeResult.status === "rejected") {
    failures.push(toFailure("store", storeResult.reason));
  }
  if (kiosksResult.status === "rejected") {
    failures.push(toFailure("kiosks", kiosksResult.reason));
  }
  if (productsResult.status === "rejected") {
    failures.push(toFailure("products", productsResult.reason));
  }
  if (menusResult.status === "rejected") {
    failures.push(toFailure("menus", menusResult.reason));
  }
  if (paymentMethodsResult.status === "rejected") {
    failures.push(toFailure("paymentMethods", paymentMethodsResult.reason));
  }

  return evaluateReadiness({
    organizationId,
    storeId,
    organization:
      organizationResult.status === "fulfilled" ? organizationResult.value : null,
    store: storeResult.status === "fulfilled" ? storeResult.value : null,
    kiosks: kiosksResult.status === "fulfilled" ? kiosksResult.value : [],
    products: productsResult.status === "fulfilled" ? productsResult.value : [],
    menus: menusResult.status === "fulfilled" ? menusResult.value : [],
    paymentMethods:
      paymentMethodsResult.status === "fulfilled" ? paymentMethodsResult.value : [],
    failures,
  });
}
