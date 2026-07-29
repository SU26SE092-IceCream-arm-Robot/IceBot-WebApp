"use client";

import { useState } from "react";
import { AlertTriangle, Network, Plus, RefreshCw } from "lucide-react";

import {
  EndpointLifecycleDialog,
  ExecutionEndpointCreateDialog,
} from "./device-management-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExecutionEndpoints } from "@/hooks/use-execution-endpoints";
import type { ExecutionEndpointResult } from "@/types/execution-endpoints";

function EndpointProvisionDialog({
  endpoint,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onReplaceTargets,
  onProvision,
}: {
  endpoint: ExecutionEndpointResult;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onReplaceTargets: (request: { targets: Array<{ runtimeTargetCode: string; machineModelCode: string; deviceId?: string | null }> }) => Promise<unknown>;
  onProvision: (request: { profileIdentity: string; clientCertificateSha256Fingerprint?: string | null; ecdsaPublicKeyPem?: string | null }) => Promise<unknown>;
}) {
  const target = endpoint.supportedRobotTargets[0];
  const [runtimeTargetCode, setRuntimeTargetCode] = useState(target?.runtimeTargetCode ?? "");
  const [machineModelCode, setMachineModelCode] = useState(target?.machineModelCode ?? "");
  const [deviceId, setDeviceId] = useState(target?.deviceId ?? "");
  const [profileIdentity, setProfileIdentity] = useState("");
  const [credential, setCredential] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const credentialLabel = endpoint.authenticationMode === "MutualTls" ? "SHA-256 certificate fingerprint" : "ECDSA public key (PEM)";

  const provision = async () => {
    if (!runtimeTargetCode.trim() || !machineModelCode.trim() || !profileIdentity.trim() || !credential.trim()) {
      setValidation("Runtime target, machine model, profile identity và credential reference là bắt buộc.");
      return;
    }
    const targetsUpdated = await onReplaceTargets({
      targets: [
        { runtimeTargetCode: runtimeTargetCode.trim(), machineModelCode: machineModelCode.trim(), deviceId: deviceId.trim() || null },
        ...endpoint.supportedRobotTargets.slice(1).map((item) => ({
          runtimeTargetCode: item.runtimeTargetCode,
          machineModelCode: item.machineModelCode,
          deviceId: item.deviceId ?? null,
        })),
      ],
    });
    if (!targetsUpdated) return;
    const provisioned = await onProvision(endpoint.authenticationMode === "MutualTls"
      ? { profileIdentity: profileIdentity.trim(), clientCertificateSha256Fingerprint: credential.trim() }
      : { profileIdentity: profileIdentity.trim(), ecdsaPublicKeyPem: credential.trim() });
    if (provisioned) onOpenChange(false);
  };

  return <Dialog open onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Provision {endpoint.endpointCode}</DialogTitle><DialogDescription>Thiết lập robot target trước, sau đó gắn identity và credential public. Mật khẩu, MQTT secret và private key không được nhập hoặc hiển thị ở đây.</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="endpoint-runtime-target">Runtime target</Label><Input id="endpoint-runtime-target" maxLength={100} value={runtimeTargetCode} onChange={(event) => setRuntimeTargetCode(event.target.value)} disabled={isSubmitting} /></div><div className="space-y-1.5"><Label htmlFor="endpoint-machine-model">Machine model</Label><Input id="endpoint-machine-model" maxLength={100} value={machineModelCode} onChange={(event) => setMachineModelCode(event.target.value)} disabled={isSubmitting} /></div></div><div className="space-y-1.5"><Label htmlFor="endpoint-device-id">Device ID (tùy chọn)</Label><Input id="endpoint-device-id" value={deviceId} onChange={(event) => setDeviceId(event.target.value)} disabled={isSubmitting} /></div><div className="space-y-1.5"><Label htmlFor="endpoint-profile-identity">Profile identity</Label><Input id="endpoint-profile-identity" value={profileIdentity} onChange={(event) => setProfileIdentity(event.target.value)} disabled={isSubmitting} /></div><div className="space-y-1.5"><Label htmlFor="endpoint-credential">{credentialLabel}</Label>{endpoint.authenticationMode === "MutualTls" ? <Input id="endpoint-credential" value={credential} onChange={(event) => setCredential(event.target.value)} disabled={isSubmitting} /> : <textarea id="endpoint-credential" className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" value={credential} onChange={(event) => setCredential(event.target.value)} disabled={isSubmitting} />}</div></div>{validation || errorMessage ? <p className="text-sm text-destructive" role="alert">{validation || errorMessage}</p> : null}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Hủy</Button><Button onClick={() => void provision()} disabled={isSubmitting}>Provision và kích hoạt</Button></DialogFooter></DialogContent></Dialog>;
}

function EndpointCredentialRotationDialog({
  endpoint,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: {
  endpoint: ExecutionEndpointResult;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: { clientCertificateSha256Fingerprint?: string | null; ecdsaPublicKeyPem?: string | null }) => Promise<unknown>;
}) {
  const [credential, setCredential] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const label = endpoint.authenticationMode === "MutualTls" ? "SHA-256 certificate fingerprint" : "ECDSA public key (PEM)";
  const submit = async () => {
    if (!credential.trim()) {
      setValidation("Credential public mới là bắt buộc.");
      return;
    }
    const result = await onSubmit(endpoint.authenticationMode === "MutualTls"
      ? { clientCertificateSha256Fingerprint: credential.trim() }
      : { ecdsaPublicKeyPem: credential.trim() });
    if (result) onOpenChange(false);
  };
  return <Dialog open onOpenChange={onOpenChange}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Xoay credential {endpoint.endpointCode}</DialogTitle><DialogDescription>Chỉ gửi fingerprint certificate hoặc public key mới. Private key, password và MQTT credential không đi qua thao tác này.</DialogDescription></DialogHeader><div className="space-y-1.5"><Label htmlFor="endpoint-rotated-credential">{label}</Label>{endpoint.authenticationMode === "MutualTls" ? <Input id="endpoint-rotated-credential" value={credential} onChange={(event) => setCredential(event.target.value)} disabled={isSubmitting} /> : <textarea id="endpoint-rotated-credential" className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" value={credential} onChange={(event) => setCredential(event.target.value)} disabled={isSubmitting} />}</div>{validation || errorMessage ? <p className="text-sm text-destructive" role="alert">{validation || errorMessage}</p> : null}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Hủy</Button><Button onClick={() => void submit()} disabled={isSubmitting}>Xoay credential</Button></DialogFooter></DialogContent></Dialog>;
}

function formatTimestamp(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa có"
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

function getEndpointStatusLabel(status: ExecutionEndpointResult["status"]) {
  return {
    Provisioning: "Chờ cấu hình",
    Active: "Đang hoạt động",
    Disabled: "Đã vô hiệu hóa",
    Retired: "Đã ngừng sử dụng",
  }[status];
}

export function ExecutionEndpointsTable({ kioskId, canManage }: { kioskId: string; canManage: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState<{
    endpoint: ExecutionEndpointResult;
    action: "disable" | "reactivate" | "retire";
  } | null>(null);
  const [provisionEndpoint, setProvisionEndpoint] = useState<ExecutionEndpointResult | null>(null);
  const [rotateCredentialEndpoint, setRotateCredentialEndpoint] = useState<ExecutionEndpointResult | null>(null);
  const management = useExecutionEndpoints(kioskId);
  const { items, isLoading, errorMessage, refresh } = management;

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="size-4 text-primary" />
              Điểm thực thi
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Chỉ hiển thị trạng thái và bằng chứng sẵn sàng; không hiển thị thông tin xác thực.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage ? <Button size="sm" onClick={() => { management.clearMutationError(); setCreateOpen(true); }}><Plus className="size-4" />Tạo điểm thực thi</Button> : null}
            <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={isLoading}>
              <RefreshCw className={isLoading ? "size-4 animate-spin" : "size-4"} />
              Làm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Đang tải điểm thực thi...
          </p>
        ) : errorMessage ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <AlertTriangle className="size-6 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Kiosk chưa có điểm thực thi.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Endpoint</TableHead>
                  <TableHead className="text-center">Profile</TableHead>
                  <TableHead className="text-center">Vòng đời</TableHead>
                  <TableHead className="text-center">Sẵn sàng</TableHead>
                  <TableHead className="text-center">Hoạt động</TableHead>
                  <TableHead className="text-center">An toàn</TableHead>
                  <TableHead className="pr-5 text-right">Báo cáo lúc</TableHead>
                  {canManage ? <TableHead className="pr-5 text-right">Thao tác</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-5 font-mono text-xs font-medium">
                      {item.endpointCode}
                    </TableCell>
                    <TableCell className="text-center">{item.executionProfile}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{getEndpointStatusLabel(item.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.readiness?.readiness ?? "Chưa có"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.readiness?.activity ?? "Chưa có"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.readiness?.safety ?? "Chưa có"}
                    </TableCell>
                    <TableCell className="pr-5 text-right text-xs text-muted-foreground">
                      {formatTimestamp(item.readiness?.executorReportedAt)}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="pr-5">
                        <div className="flex justify-end gap-1">
                          {item.status === "Active" ? <Button size="sm" variant="outline" disabled={management.isMutating} onClick={() => { management.clearMutationError(); setLifecycleAction({ endpoint: item, action: "disable" }); }}>Vô hiệu hóa</Button> : null}
                          {item.status === "Disabled" ? <Button size="sm" variant="outline" disabled={management.isMutating} onClick={() => { management.clearMutationError(); setLifecycleAction({ endpoint: item, action: "reactivate" }); }}>Kích hoạt lại</Button> : null}
                          {item.status === "Provisioning" || item.status === "Disabled" ? <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={management.isMutating} onClick={() => { management.clearMutationError(); setLifecycleAction({ endpoint: item, action: "retire" }); }}>Ngừng sử dụng</Button> : null}
                          {item.status === "Provisioning" ? <Button size="sm" variant="outline" disabled={management.isMutating} onClick={() => { management.clearMutationError(); setProvisionEndpoint(item); }}>Provision</Button> : null}
                          {item.status === "Active" || item.status === "Disabled" ? <Button size="sm" variant="outline" disabled={management.isMutating} onClick={() => { management.clearMutationError(); setRotateCredentialEndpoint(item); }}>Xoay credential</Button> : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {createOpen ? (
        <ExecutionEndpointCreateDialog
          open
          isSubmitting={management.isMutating}
          errorMessage={management.mutationErrorMessage}
          onOpenChange={(open) => { if (!management.isMutating) setCreateOpen(open); }}
          onSubmit={management.createEndpoint}
        />
      ) : null}
      {lifecycleAction ? (
        <EndpointLifecycleDialog
          endpoint={lifecycleAction.endpoint}
          action={lifecycleAction.action}
          isSubmitting={management.isMutating}
          errorMessage={management.mutationErrorMessage}
          onOpenChange={(open) => { if (!open && !management.isMutating) setLifecycleAction(null); }}
          onSubmit={() => management.setLifecycle(lifecycleAction.endpoint.id, lifecycleAction.action)}
        />
      ) : null}
      {provisionEndpoint ? <EndpointProvisionDialog endpoint={provisionEndpoint} isSubmitting={management.isMutating} errorMessage={management.mutationErrorMessage} onOpenChange={(open) => { if (!open && !management.isMutating) setProvisionEndpoint(null); }} onReplaceTargets={(request) => management.replaceRobotTargets(provisionEndpoint.id, request)} onProvision={(request) => management.provisionEndpoint(provisionEndpoint.id, request)} /> : null}
      {rotateCredentialEndpoint ? <EndpointCredentialRotationDialog endpoint={rotateCredentialEndpoint} isSubmitting={management.isMutating} errorMessage={management.mutationErrorMessage} onOpenChange={(open) => { if (!open && !management.isMutating) setRotateCredentialEndpoint(null); }} onSubmit={(request) => management.rotateCredential(rotateCredentialEndpoint.id, request)} /> : null}
    </Card>
  );
}
