"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Play, Plus, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFranchiseOnboarding } from "@/hooks/use-franchise-onboarding";
import type { FranchiseOnboardingResult } from "@/types/franchise-onboarding";

const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

function statusLabel(status: FranchiseOnboardingResult["status"]) {
  return { Pending: "Pending", Running: "Running", Failed: "Needs attention", ReadyForActivation: "Ready for activation review", Cancelled: "Cancelled" }[status];
}

export function FranchiseOnboardingPanel({ organizationId, canManage }: { organizationId: string; canManage: boolean }) {
  const workflow = useFranchiseOnboarding(organizationId, canManage);
  const [startOpen, setStartOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<FranchiseOnboardingResult | null>(null);
  const [storeCode, setStoreCode] = useState("");
  const [storeName, setStoreName] = useState("");
  const [kioskCode, setKioskCode] = useState("");
  const [kioskName, setKioskName] = useState("");
  const [timeZone, setTimeZone] = useState(DEFAULT_TIME_ZONE);
  const [reason, setReason] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  if (!canManage) return null;

  const start = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (storeCode.trim().length < 2 || storeName.trim().length === 0 || kioskCode.trim().length < 2 || kioskName.trim().length === 0 || timeZone.trim().length === 0) {
      setValidationMessage("Store code, store name, kiosk code, kiosk name, and time zone are required.");
      return;
    }
    setValidationMessage(null);
    const result = await workflow.start({
      store: { code: storeCode.trim().toUpperCase(), name: storeName.trim(), storeType: "Retail", timeZone: timeZone.trim(), openingHours: [] },
      kiosk: { code: kioskCode.trim().toUpperCase(), name: kioskName.trim(), kioskType: "RoboticVending", timeZone: timeZone.trim() },
    });
    if (result) {
      setStartOpen(false);
      setStoreCode(""); setStoreName(""); setKioskCode(""); setKioskName(""); setTimeZone(DEFAULT_TIME_ZONE);
    }
  };

  const cancel = async () => {
    if (!cancelTarget) return;
    const normalizedReason = reason.trim();
    if (!normalizedReason || normalizedReason.length > 500) {
      setValidationMessage("A cancellation reason of at most 500 characters is required.");
      return;
    }
    if (await workflow.cancel(cancelTarget.id, normalizedReason)) {
      setCancelTarget(null); setReason(""); setValidationMessage(null);
    }
  };

  return (
    <Card className="gap-0 rounded-xl border border-border/80 py-0 shadow-none">
      <CardHeader className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><CardTitle className="text-base font-semibold">Franchise setup</CardTitle><p className="mt-1 text-xs text-muted-foreground">Creates the Store and Kiosk through one recoverable workflow. It does not activate sales or install a production package.</p></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void workflow.refresh()} disabled={workflow.isLoading || workflow.isMutating}><RefreshCw className={workflow.isLoading ? "size-4 animate-spin" : "size-4"} />Refresh</Button><Button size="sm" onClick={() => { workflow.clearError(); setStartOpen(true); }} disabled={workflow.isMutating}><Plus className="size-4" />Start setup</Button></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {workflow.errorMessage ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{workflow.errorMessage}</p> : null}
        {workflow.isLoading ? <p className="text-sm text-muted-foreground">Loading franchise setup history...</p> : null}
        {!workflow.isLoading && workflow.items.length === 0 ? <p className="text-sm text-muted-foreground">No franchise setup has been started for this organization.</p> : null}
        {workflow.items.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 space-y-1"><p className="font-medium">{statusLabel(item.status)}</p><p className="font-mono text-xs text-muted-foreground">{item.id}</p>{item.failureMessage ? <p className="text-sm text-destructive">{item.failureCode ? `${item.failureCode}: ` : ""}{item.failureMessage}</p> : null}</div><div className="flex shrink-0 flex-wrap gap-2">{item.status === "Failed" ? <Button size="sm" variant="outline" disabled={workflow.isMutating} onClick={() => void workflow.resume(item.id)}><Play className="size-4" />Resume</Button> : null}{item.status !== "ReadyForActivation" && item.status !== "Cancelled" ? <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={workflow.isMutating} onClick={() => { workflow.clearError(); setValidationMessage(null); setCancelTarget(item); }}><XCircle className="size-4" />Cancel</Button> : null}</div></div>)}
      </CardContent>

      <Dialog open={startOpen} onOpenChange={(open) => { if (!workflow.isMutating) setStartOpen(open); }}><DialogContent className="sm:max-w-2xl"><form onSubmit={(event) => void start(event)} className="space-y-5"><DialogHeader><DialogTitle>Start franchise setup</DialogTitle><DialogDescription>This creates a Store and a Provisioning Kiosk. Sales, device provisioning, packages, and deployment remain separate review steps.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><Label htmlFor="onboarding-store-code">Store code</Label><Input id="onboarding-store-code" value={storeCode} maxLength={50} disabled={workflow.isMutating} onChange={(event) => setStoreCode(event.target.value)} /></label><label className="space-y-1.5"><Label htmlFor="onboarding-store-name">Store name</Label><Input id="onboarding-store-name" value={storeName} maxLength={200} disabled={workflow.isMutating} onChange={(event) => setStoreName(event.target.value)} /></label><label className="space-y-1.5"><Label htmlFor="onboarding-kiosk-code">Kiosk code</Label><Input id="onboarding-kiosk-code" value={kioskCode} maxLength={50} disabled={workflow.isMutating} onChange={(event) => setKioskCode(event.target.value)} /></label><label className="space-y-1.5"><Label htmlFor="onboarding-kiosk-name">Kiosk name</Label><Input id="onboarding-kiosk-name" value={kioskName} maxLength={200} disabled={workflow.isMutating} onChange={(event) => setKioskName(event.target.value)} /></label><label className="space-y-1.5 sm:col-span-2"><Label htmlFor="onboarding-time-zone">Time zone</Label><Input id="onboarding-time-zone" value={timeZone} disabled={workflow.isMutating} onChange={(event) => setTimeZone(event.target.value)} /></label></div><p className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">Opening hours are not configured by this shortcut. Configure the sales schedule before the Store is allowed to sell.</p>{validationMessage || workflow.errorMessage ? <p className="text-sm text-destructive" role="alert">{validationMessage || workflow.errorMessage}</p> : null}<DialogFooter><Button type="button" variant="outline" disabled={workflow.isMutating} onClick={() => setStartOpen(false)}>Cancel</Button><Button type="submit" disabled={workflow.isMutating}>Start setup</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={cancelTarget !== null} onOpenChange={(open) => { if (!open && !workflow.isMutating) setCancelTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Cancel franchise setup</DialogTitle><DialogDescription>Cancellation preserves audit evidence. A ready setup cannot be cancelled.</DialogDescription></DialogHeader><label className="space-y-1.5"><Label htmlFor="onboarding-cancel-reason">Reason</Label><Input id="onboarding-cancel-reason" value={reason} maxLength={500} disabled={workflow.isMutating} onChange={(event) => setReason(event.target.value)} /></label>{validationMessage || workflow.errorMessage ? <p className="text-sm text-destructive" role="alert">{validationMessage || workflow.errorMessage}</p> : null}<DialogFooter><Button variant="outline" disabled={workflow.isMutating} onClick={() => setCancelTarget(null)}>Back</Button><Button variant="destructive" disabled={workflow.isMutating} onClick={() => void cancel()}><AlertTriangle className="size-4" />Cancel setup</Button></DialogFooter></DialogContent></Dialog>
    </Card>
  );
}
