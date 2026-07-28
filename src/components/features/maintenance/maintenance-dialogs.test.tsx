import { describe, expect, it } from "vitest";

import {
  getAvailableMaintenanceWorkflowActions,
  isEligibleMaintenanceAssignee,
} from "@/components/features/maintenance/maintenance-dialogs";
import type { InternalAccountResult } from "@/types/accounts";
import type { MaintenanceTicketResult } from "@/types/maintenance";

const ticket = {
  id: "ticket-1",
  organizationId: "org-1",
  storeId: "store-1",
  kioskId: "kiosk-1",
  status: "Open",
  operationalImpact: "None",
} as MaintenanceTicketResult;

function account(roleCode: string, scope: Record<string, string>) {
  return {
    id: `${roleCode}-account`,
    status: "Active",
    roles: [{ roleCode, ...scope }],
  } as InternalAccountResult;
}

describe("maintenance lifecycle and assignee rules", () => {
  it("keeps coordination actions away from Technician while allowing work", () => {
    expect(
      getAvailableMaintenanceWorkflowActions(ticket, false, true),
    ).toEqual(["start"]);
    expect(
      getAvailableMaintenanceWorkflowActions(
        { ...ticket, status: "Resolved" },
        false,
        true,
      ),
    ).toEqual([]);
    expect(
      getAvailableMaintenanceWorkflowActions(
        { ...ticket, status: "InProgress" },
        false,
        true,
      ),
    ).toEqual(["resolve"]);
  });

  it("accepts only backend-supported roles in the current ticket scope", () => {
    expect(
      isEligibleMaintenanceAssignee(
        account("Technician", { kioskId: "kiosk-1" }),
        ticket,
      ),
    ).toBe(true);
    expect(
      isEligibleMaintenanceAssignee(
        account("Manager", { storeId: "store-1" }),
        ticket,
      ),
    ).toBe(true);
    expect(
      isEligibleMaintenanceAssignee(
        account("Staff", { kioskId: "kiosk-1" }),
        ticket,
      ),
    ).toBe(false);
    expect(
      isEligibleMaintenanceAssignee(
        account("Technician", { kioskId: "other-kiosk" }),
        ticket,
      ),
    ).toBe(false);
  });
});
