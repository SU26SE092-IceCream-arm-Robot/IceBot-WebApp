"use client";

import { useMemo } from "react";

import { ReadinessCheckGroup } from "@/components/features/readiness/readiness-check-group";
import { ReadinessHeader } from "@/components/features/readiness/readiness-header";
import { ReadinessNextActions } from "@/components/features/readiness/readiness-next-actions";
import {
  ReadinessEmptyState,
  ReadinessErrorState,
  ReadinessLoadingState,
  ReadinessPartialFailureBanner,
} from "@/components/features/readiness/readiness-overview-states";
import { ReadinessScopeSelector } from "@/components/features/readiness/readiness-scope-selector";
import { ReadinessSummaryCard } from "@/components/features/readiness/readiness-summary-card";
import { useSetupReadiness } from "@/hooks/use-setup-readiness";
import type { ReadinessCheckGroup as ReadinessCheckGroupName } from "@/types/setup-readiness";

const GROUP_ORDER: ReadinessCheckGroupName[] = ["scope", "kiosk", "catalog", "payment"];

export default function ReadinessPage() {
  const {
    organizations,
    availableStores,
    selectedOrganizationId,
    selectedStoreId,
    result,
    scopeFailures,
    isScopeLoading,
    isLoading,
    isRefreshing,
    errorMessage,
    lastUpdatedAt,
    setSelectedOrganizationId,
    setSelectedStoreId,
    refreshScope,
    refresh,
  } = useSetupReadiness();

  const checksByGroup = useMemo(() => {
    const groups = new Map(
      GROUP_ORDER.map((group) => [
        group,
        result?.checks.filter((check) => check.group === group) ?? [],
      ]),
    );
    return groups;
  }, [result]);

  const handleRefresh = () => {
    if (selectedOrganizationId && selectedStoreId) {
      void refresh();
      return;
    }

    void refreshScope();
  };

  return (
    <main className="space-y-6">
      <ReadinessHeader
        lastUpdatedAt={lastUpdatedAt}
        isRefreshing={isRefreshing || isScopeLoading}
        onRefresh={handleRefresh}
      />

      <ReadinessScopeSelector
        organizations={organizations}
        stores={availableStores}
        selectedOrganizationId={selectedOrganizationId}
        selectedStoreId={selectedStoreId}
        isLoading={isScopeLoading}
        onOrganizationChange={setSelectedOrganizationId}
        onStoreChange={setSelectedStoreId}
      />

      {errorMessage ? (
        <ReadinessErrorState message={errorMessage} onRetry={handleRefresh} />
      ) : null}

      {!errorMessage && (isScopeLoading || isLoading) ? (
        <ReadinessLoadingState />
      ) : null}

      {!errorMessage && !isScopeLoading && !isLoading && (!selectedOrganizationId || !selectedStoreId) ? (
        <ReadinessEmptyState />
      ) : null}

      {!errorMessage && !isScopeLoading && !isLoading && result ? (
        <div className="space-y-6">
          <ReadinessPartialFailureBanner
            failures={scopeFailures}
            unknownCount={result.summary.unknownCount}
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="space-y-4">
              <ReadinessSummaryCard summary={result.summary} />
              {GROUP_ORDER.map((group) => {
                const checks = checksByGroup.get(group) ?? [];
                return checks.length > 0 ? (
                  <ReadinessCheckGroup key={group} group={group} checks={checks} />
                ) : null;
              })}
            </div>

            <aside className="space-y-4">
              <ReadinessNextActions actions={result.nextActions} />
            </aside>
          </div>
        </div>
      ) : null}
    </main>
  );
}
