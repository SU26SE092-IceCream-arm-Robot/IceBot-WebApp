import { describe, expect, it } from "vitest";

import {
  getAvailableMaintenanceWorkflowActions,
} from "@/components/features/operations/maintenance/maintenance-dialogs";
import type { MaintenanceTicketResult } from "@/types/operations/maintenance";

const ticket = {
  id: "ticket-1",
  organizationId: "org-1",
  storeId: "store-1",
  kioskId: "kiosk-1",
  status: "Open",
  operationalImpact: "None",
} as MaintenanceTicketResult;

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
});
