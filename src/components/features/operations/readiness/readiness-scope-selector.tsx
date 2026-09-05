"use client";

import { Building2, Store } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SetupReadinessOrganizationOption,
  SetupReadinessStoreOption,
} from "@/types/operations/readiness";

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
  const selectedOrganization = organizations.find(
    (organization) => organization.id === selectedOrganizationId,
  );
  const selectedStore = stores.find((store) => store.id === selectedStoreId);

  return (
    <Card className="gap-0 border-border py-0 shadow-none">
      <CardContent className="grid gap-3 bg-muted/10 p-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="readiness-organization"
            className="flex items-center gap-2"
          >
            <Building2 className="size-4 text-primary" aria-hidden="true" />
            Tổ chức
          </Label>
          <Select
            value={selectedOrganizationId ?? "NONE"}
            onValueChange={(value) =>
              onOrganizationChange(value === "NONE" ? null : value)
            }
            disabled={isLoading || organizations.length === 0}
          >
            <SelectTrigger
              id="readiness-organization"
              className="w-full bg-card"
            >
              <SelectValue placeholder="Chọn tổ chức">
                {selectedOrganizationId
                  ? selectedOrganization
                    ? organizationLabel(selectedOrganization)
                    : selectedOrganizationId
                  : "Chọn tổ chức"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Chọn tổ chức</SelectItem>
              {organizations.map((organization) => (
                <SelectItem key={organization.id} value={organization.id}>
                  {organizationLabel(organization)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="readiness-store" className="flex items-center gap-2">
            <Store className="size-4 text-primary" aria-hidden="true" />
            Cửa hàng
          </Label>
          <Select
            value={selectedStoreId ?? "NONE"}
            onValueChange={(value) =>
              onStoreChange(value === "NONE" ? null : value)
            }
            disabled={
              isLoading || !selectedOrganizationId || stores.length === 0
            }
          >
            <SelectTrigger id="readiness-store" className="w-full bg-card">
              <SelectValue placeholder="Chọn cửa hàng">
                {selectedStoreId
                  ? selectedStore
                    ? storeLabel(selectedStore)
                    : selectedStoreId
                  : "Chọn cửa hàng"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Chọn cửa hàng</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {storeLabel(store)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
