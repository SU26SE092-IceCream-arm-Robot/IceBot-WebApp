"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotificationDeliveries } from "@/hooks/use-notification-deliveries";
import type { NotificationDeliveryResult } from "@/types/notification-deliveries";

function statusLabel(status: NotificationDeliveryResult["status"]) {
  return { Pending: "Queued", Processing: "Processing", Failed: "Retry scheduled", PermanentFailure: "Permanently failed", Delivered: "Delivered" }[status];
}

export function NotificationDeliveriesPanel({ organizationId, canView, canManage }: { organizationId: string; canView: boolean; canManage: boolean }) {
  const deliveries = useNotificationDeliveries(organizationId, canView);
  const [target, setTarget] = useState<NotificationDeliveryResult | null>(null);
  const [reason, setReason] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  if (!canView) return null;

  const requeue = async () => {
    if (!target) return;
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 3 || normalizedReason.length > 500) {
      setValidationMessage("A requeue reason between 3 and 500 characters is required.");
      return;
    }
    if (await deliveries.requeue(target.id, normalizedReason)) {
      setTarget(null); setReason(""); setValidationMessage(null);
    }
  };

  return (
    <Card className="gap-0 rounded-xl border border-border/80 py-0 shadow-none">
      <CardHeader className="border-b border-border px-5 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base font-semibold">Notification delivery</CardTitle><p className="mt-1 text-xs text-muted-foreground">Operational delivery status and retry evidence. Message content and provider diagnostics are intentionally excluded.</p></div><Button variant="outline" size="sm" onClick={() => void deliveries.refresh()} disabled={deliveries.isLoading || deliveries.isMutating}><RefreshCw className={deliveries.isLoading ? "size-4 animate-spin" : "size-4"} />Refresh</Button></div></CardHeader>
      <CardContent className="space-y-3 p-5">
        {deliveries.errorMessage ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{deliveries.errorMessage}</p> : null}
        {deliveries.isLoading ? <p className="text-sm text-muted-foreground">Loading notification delivery status...</p> : null}
        {!deliveries.isLoading && deliveries.items.length === 0 ? <p className="text-sm text-muted-foreground">No notification deliveries are available in this organization scope.</p> : null}
        {deliveries.items.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 space-y-1"><p className="font-medium">{item.notificationType} - {statusLabel(item.status)}</p><p className="text-xs text-muted-foreground">Attempts: {item.attemptCount}/{item.maxAttempts}{item.lastErrorCode ? ` - ${item.lastErrorCode}` : ""}</p><p className="font-mono text-xs text-muted-foreground">{item.id}</p></div>{canManage && item.status === "PermanentFailure" ? <Button size="sm" variant="outline" disabled={deliveries.isMutating} onClick={() => { setValidationMessage(null); setTarget(item); }}><RotateCw className="size-4" />Requeue</Button> : null}</div>)}
      </CardContent>
      <Dialog open={target !== null} onOpenChange={(open) => { if (!open && !deliveries.isMutating) setTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Requeue notification delivery</DialogTitle><DialogDescription>This records an audited retry request. It does not reveal the notification body or provider error detail.</DialogDescription></DialogHeader><label className="space-y-1.5"><Label htmlFor="notification-requeue-reason">Reason</Label><Input id="notification-requeue-reason" value={reason} maxLength={500} disabled={deliveries.isMutating} onChange={(event) => setReason(event.target.value)} /></label>{validationMessage || deliveries.errorMessage ? <p className="text-sm text-destructive" role="alert">{validationMessage || deliveries.errorMessage}</p> : null}<DialogFooter><Button variant="outline" disabled={deliveries.isMutating} onClick={() => setTarget(null)}>Back</Button><Button disabled={deliveries.isMutating} onClick={() => void requeue()}><AlertTriangle className="size-4" />Requeue</Button></DialogFooter></DialogContent></Dialog>
    </Card>
  );
}
