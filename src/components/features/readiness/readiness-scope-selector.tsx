"use client";

import { Building2, Store } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type {
  SetupReadinessOrganizationOption,
  SetupReadinessStoreOption,
} from "@/types/setup-readiness";

interface ReadinessScopeSelectorProps {
  organizations: SetupReadinessOrganizationOption[];
  stores: SetupReadinessStoreOption[];
  selectedOrganizationId: string | null;
  selectedStoreId: string | null;
  isLoading: boolean;
  onOrganizationChange: (organizationId: string | null) => void;
  onStoreChange: (storeId: string | null) => void;
}

function organizationLabel(organization: SetupReadinessOrganizationOption) {
  const name = organization.name?.trim() || organization.id;
  return organization.code ? `${name} (${organization.code})` : name;
}

function storeLabel(store: SetupReadinessStoreOption) {
  return store.code ? `${store.name} (${store.code})` : store.name;
}

export function ReadinessScopeSelector({
  organizations,
  stores,
  selectedOrganizationId,
  selectedStoreId,
  isLoading,
  onOrganizationChange,
  onStoreChange,
}: ReadinessScopeSelectorProps) {
  return (
    <Card>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Building2 className="size-4 text-primary" />
            Tổ chức
          </span>
          <select
            value={selectedOrganizationId ?? ""}
            onChange={(event) => onOrganizationChange(event.target.value || null)}
            disabled={isLoading || organizations.length === 0}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Chọn tổ chức</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organizationLabel(organization)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Store className="size-4 text-primary" />
            Cửa hàng
          </span>
          <select
            value={selectedStoreId ?? ""}
            onChange={(event) => onStoreChange(event.target.value || null)}
            disabled={isLoading || !selectedOrganizationId || stores.length === 0}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Chọn cửa hàng</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {storeLabel(store)}
              </option>
            ))}
          </select>
        </label>
      </CardContent>
    </Card>
  );
}
