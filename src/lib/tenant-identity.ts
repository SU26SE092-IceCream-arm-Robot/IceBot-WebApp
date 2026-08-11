import type { StoreResult } from "@/types/kiosks/management";
import type { OrganizationResult } from "@/types/tenants/management";

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");
}

function normalizeTaxCode(value: string): string {
  return value.replace(/[\s-]/g, "").toLocaleUpperCase("vi-VN");
}

export type OrganizationIdentityConflict = "name" | "taxCode";

export function findOrganizationIdentityConflict(
  organizations: readonly OrganizationResult[],
  candidate: { name: string; taxCode?: string | null },
  excludeOrganizationId?: string,
): OrganizationIdentityConflict | null {
  const normalizedName = normalizeText(candidate.name);
  const normalizedTaxCode = normalizeTaxCode(candidate.taxCode ?? "");

  for (const organization of organizations) {
    if (organization.id === excludeOrganizationId) continue;

    if (normalizeText(organization.name) === normalizedName) return "name";
    if (
      normalizedTaxCode &&
      normalizeTaxCode(organization.taxCode ?? "") === normalizedTaxCode
    ) {
      return "taxCode";
    }
  }

  return null;
}

export function hasDuplicateStoreName(
  stores: readonly StoreResult[],
  candidateName: string,
  excludeStoreId?: string,
): boolean {
  const normalizedName = normalizeText(candidateName);
  return stores.some(
    (store) =>
      store.id !== excludeStoreId &&
      normalizeText(store.name) === normalizedName,
  );
}
