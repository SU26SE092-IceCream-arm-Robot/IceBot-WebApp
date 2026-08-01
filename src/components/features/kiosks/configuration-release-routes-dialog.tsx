"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  createConfigurationReleaseRouteDrafts,
  toConfigurationReleaseRouteRequests,
  type ConfigurationReleaseRouteDraft,
  validateConfigurationReleaseRouteDrafts,
} from "@/components/features/kiosks/configuration-release-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ConfigurationReleaseAuthoringOptions,
  ConfigurationReleaseResult,
  ConfigurationReleaseRouteRequest,
} from "@/types/production-operations";

interface ConfigurationReleaseRoutesDialogProps {
  release: ConfigurationReleaseResult;
  options: ConfigurationReleaseAuthoringOptions | null;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onLoadOptions: () => Promise<unknown>;
  onSubmit: (routes: ConfigurationReleaseRouteRequest[]) => Promise<unknown>;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ConfigurationReleaseRoutesDialog({
  release,
  options,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onLoadOptions,
  onSubmit,
}: ConfigurationReleaseRoutesDialogProps) {
  const [routes, setRoutes] = useState(() =>
    createConfigurationReleaseRouteDrafts(release),
  );
  const [selectedKey, setSelectedKey] = useState(
    () => release.routes[0]?.id ?? "",
  );
  const [validation, setValidation] = useState<string | null>(null);
  const [initialSnapshot] = useState(() =>
    JSON.stringify(
      toConfigurationReleaseRouteRequests(
        createConfigurationReleaseRouteDrafts(release),
      ),
    ),
  );

  const selectedIndex = routes.findIndex((route) => route.clientKey === selectedKey);
  const selectedRoute = selectedIndex >= 0 ? routes[selectedIndex] : null;
  const isDirty =
    JSON.stringify(toConfigurationReleaseRouteRequests(routes)) !== initialSnapshot;
  const selectedRecipe = options?.recipes.find(
    (recipe) => recipe.id === selectedRoute?.recipeId,
  );
  const capabilityCodes = useMemo(() => {
    const codes = new Set(options?.workcellCapabilities.map((item) => item.code) ?? []);
    selectedRoute?.requiredCapabilities.forEach((item) => codes.add(item.code));
    selectedRoute?.robotBindings.forEach((item) =>
      codes.add(item.requiredWorkcellCapabilityCode),
    );
    return [...codes].filter(Boolean).sort();
  }, [options?.workcellCapabilities, selectedRoute]);
  const productionOptions = selectedRecipe?.productionOptionCandidates ?? [];
  const supportedOptionCodes = new Set(selectedRoute?.supportedOptionCodes ?? []);
  const unavailableSelectedOptions = [...supportedOptionCodes].filter(
    (code) => !productionOptions.some((item) => item.code === code),
  );

  const updateSelected = (
    updater: (route: ConfigurationReleaseRouteDraft) => ConfigurationReleaseRouteDraft,
  ) => {
    if (selectedIndex < 0) return;
    setRoutes((items) =>
      items.map((route, index) => (index === selectedIndex ? updater(route) : route)),
    );
    setValidation(null);
  };

  const nextRouteCode = () => {
    let index = routes.length + 1;
    const used = new Set(routes.map((route) => route.routeCode.toUpperCase()));
    while (used.has(`ROUTE-${index}`)) index += 1;
    return `ROUTE-${index}`;
  };

  const addRoute = () => {
    const recipe = options?.recipes[0];
    const program = options?.robotPrograms[0];
    const capability =
      program?.workcellCapabilityCodes[0] ?? options?.workcellCapabilities[0]?.code ?? "";
    const clientKey = `new-${Date.now()}-${routes.length}`;
    const route: ConfigurationReleaseRouteDraft = {
      clientKey,
      recipeId: recipe?.id ?? "",
      routeCode: nextRouteCode(),
      priority: routes.length,
      requiredCapabilities: capability ? [{ code: capability, required: true }] : [],
      supportedOptionCodes: [],
      robotBindings: [
        {
          robotProgramId: program?.id ?? "",
          bindingOrder: 1,
          requiredWorkcellCapabilityCode: capability,
        },
      ],
    };
    setRoutes((items) => [...items, route]);
    setSelectedKey(clientKey);
    setValidation(null);
  };

  const requestClose = () => {
    if (isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Đóng trình soạn thảo?")) {
      return;
    }
    onOpenChange(false);
  };

  const submit = async () => {
    const error = validateConfigurationReleaseRouteDrafts(routes);
    if (error) {
      setValidation(error);
      return;
    }
    const result = await onSubmit(toConfigurationReleaseRouteRequests(routes));
    if (result) onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && requestClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            Tuyến sản xuất của bản nháp #{release.releaseNumber}
          </DialogTitle>
          <DialogDescription>
            Mọi lần lưu đều thay thế toàn bộ danh sách tuyến. Trình soạn thảo giữ
            nguyên tuyến, tùy chọn và năng lực hiện có trước khi gửi.
          </DialogDescription>
        </DialogHeader>

        {!options ? (
          <div className="space-y-3 rounded-md border border-dashed p-5 text-sm text-muted-foreground">
            <p>Cần tải Recipe, chương trình và năng lực hợp lệ từ backend.</p>
            <Button
              variant="outline"
              onClick={() => void onLoadOptions()}
              disabled={isSubmitting}
            >
              Tải dữ liệu soạn thảo
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="space-y-3 lg:border-r lg:pr-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">Danh sách tuyến</p>
                  <p className="text-xs text-muted-foreground">{routes.length} tuyến</p>
                </div>
                <Button size="sm" onClick={addRoute} disabled={isSubmitting}>
                  <Plus className="size-4" /> Thêm tuyến
                </Button>
              </div>
              {routes.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Chưa có tuyến. Thêm ít nhất một tuyến để lưu bản nháp.
                </p>
              ) : (
                <div className="divide-y rounded-md border">
                  {routes.map((route, index) => {
                    const recipe = options.recipes.find((item) => item.id === route.recipeId);
                    return (
                      <button
                        key={route.clientKey}
                        type="button"
                        className={`w-full p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${selectedKey === route.clientKey ? "bg-primary/10" : "hover:bg-muted/50"}`}
                        onClick={() => setSelectedKey(route.clientKey)}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium">{route.routeCode || `Tuyến ${index + 1}`}</span>
                          <Badge variant="outline">{route.robotBindings.length} liên kết</Badge>
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {recipe ? `${recipe.productVariantName} — ${recipe.name} v${recipe.version}` : "Chưa chọn Recipe"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>

            {selectedRoute ? (
              <div className="min-w-0 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <p className="font-medium">Chi tiết tuyến</p>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Đưa tuyến lên"
                      aria-label="Đưa tuyến lên"
                      disabled={selectedIndex === 0 || isSubmitting}
                      onClick={() => setRoutes((items) => moveItem(items, selectedIndex, selectedIndex - 1))}
                    ><ArrowUp className="size-4" /></Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Đưa tuyến xuống"
                      aria-label="Đưa tuyến xuống"
                      disabled={selectedIndex === routes.length - 1 || isSubmitting}
                      onClick={() => setRoutes((items) => moveItem(items, selectedIndex, selectedIndex + 1))}
                    ><ArrowDown className="size-4" /></Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Nhân bản tuyến"
                      aria-label="Nhân bản tuyến"
                      disabled={isSubmitting}
                      onClick={() => {
                        const clientKey = `copy-${Date.now()}`;
                        const copy = {
                          ...selectedRoute,
                          clientKey,
                          routeCode: `${selectedRoute.routeCode.slice(0, 94)}-COPY`,
                          requiredCapabilities: selectedRoute.requiredCapabilities.map((item) => ({ ...item })),
                          supportedOptionCodes: [...selectedRoute.supportedOptionCodes],
                          robotBindings: selectedRoute.robotBindings.map((item) => ({ ...item })),
                        };
                        setRoutes((items) => [...items.slice(0, selectedIndex + 1), copy, ...items.slice(selectedIndex + 1)]);
                        setSelectedKey(clientKey);
                      }}
                    ><Copy className="size-4" /></Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Xóa tuyến"
                      aria-label="Xóa tuyến"
                      disabled={isSubmitting}
                      onClick={() => {
                        if (!window.confirm(`Xóa tuyến ${selectedRoute.routeCode || "đang chọn"}?`)) return;
                        const next = routes.filter((item) => item.clientKey !== selectedRoute.clientKey);
                        setRoutes(next);
                        setSelectedKey(next[Math.min(selectedIndex, next.length - 1)]?.clientKey ?? "");
                      }}
                    ><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Recipe đã phát hành</Label>
                    <Select
                      value={selectedRoute.recipeId}
                      onValueChange={(value) => updateSelected((route) => ({ ...route, recipeId: value ?? "" }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full"><SelectValue>{selectedRecipe ? `${selectedRecipe.productVariantName} — ${selectedRecipe.name} v${selectedRecipe.version}` : "Chọn Recipe"}</SelectValue></SelectTrigger>
                      <SelectContent>{options.recipes.map((recipe) => <SelectItem key={recipe.id} value={recipe.id}>{recipe.productVariantName} — {recipe.name} v{recipe.version}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="release-route-code">Mã tuyến</Label>
                    <Input id="release-route-code" maxLength={100} value={selectedRoute.routeCode} disabled={isSubmitting} onChange={(event) => updateSelected((route) => ({ ...route, routeCode: event.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="release-route-priority">Độ ưu tiên</Label>
                    <Input id="release-route-priority" type="number" min={0} step={1} value={selectedRoute.priority} disabled={isSubmitting} onChange={(event) => updateSelected((route) => ({ ...route, priority: Number(event.target.value) }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div><p className="font-medium">Năng lực trạm bắt buộc</p><p className="text-xs text-muted-foreground">Chỉ dùng mã do chương trình robot và backend công bố.</p></div>
                  {capabilityCodes.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có năng lực authoritative trong phạm vi lựa chọn.</p> : <div className="grid gap-2 sm:grid-cols-2">{capabilityCodes.map((code) => { const checked = selectedRoute.requiredCapabilities.some((item) => item.code === code); return <label key={code} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><input type="checkbox" checked={checked} disabled={isSubmitting} onChange={(event) => updateSelected((route) => ({ ...route, requiredCapabilities: event.target.checked ? [...route.requiredCapabilities, { code, required: true }] : route.requiredCapabilities.filter((item) => item.code !== code) }))} /><span>{code}</span></label>; })}</div>}
                </div>

                <div className="space-y-2">
                  <div><p className="font-medium">Tùy chọn sản xuất được hỗ trợ</p><p className="text-xs text-muted-foreground">Danh sách lấy từ Product Option có ảnh hưởng sản xuất của Recipe.</p></div>
                  {productionOptions.length === 0 ? <p className="text-sm text-muted-foreground">Recipe này không có tùy chọn sản xuất khả dụng.</p> : <div className="grid gap-2 sm:grid-cols-2">{productionOptions.map((option) => <label key={option.id} className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"><input className="mt-1" type="checkbox" checked={supportedOptionCodes.has(option.code)} disabled={isSubmitting || !option.isAvailable} onChange={(event) => updateSelected((route) => ({ ...route, supportedOptionCodes: event.target.checked ? [...route.supportedOptionCodes, option.code] : route.supportedOptionCodes.filter((code) => code !== option.code) }))} /><span><span className="font-medium">{option.name}</span><span className="block text-xs text-muted-foreground">{option.optionGroupName} · {option.code}{!option.isAvailable ? " · Không khả dụng" : ""}</span></span></label>)}</div>}
                  {unavailableSelectedOptions.length > 0 ? <p className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">Đang giữ {unavailableSelectedOptions.length} mã tùy chọn cũ chưa có trong read model hiện tại: {unavailableSelectedOptions.join(", ")}.</p> : null}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2"><div><p className="font-medium">Liên kết thực thi</p><p className="text-xs text-muted-foreground">Thứ tự từ trên xuống là thứ tự backend nhận.</p></div><Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => updateSelected((route) => ({ ...route, robotBindings: [...route.robotBindings, { robotProgramId: options.robotPrograms[0]?.id ?? "", bindingOrder: route.robotBindings.length + 1, requiredWorkcellCapabilityCode: options.robotPrograms[0]?.workcellCapabilityCodes[0] ?? capabilityCodes[0] ?? "" }] }))}><Plus className="size-4" /> Thêm liên kết</Button></div>
                  <div className="divide-y rounded-md border">{selectedRoute.robotBindings.map((binding, bindingIndex) => { const program = options.robotPrograms.find((item) => item.id === binding.robotProgramId); const bindingCapabilities = [...new Set([...(program?.workcellCapabilityCodes ?? []), binding.requiredWorkcellCapabilityCode])].filter(Boolean); return <div key={`${binding.robotProgramId}-${bindingIndex}`} className="grid gap-3 p-3 sm:grid-cols-[2fr_1.5fr_auto]"><div className="space-y-1.5"><Label>Chương trình #{bindingIndex + 1}</Label><Select value={binding.robotProgramId} onValueChange={(value) => updateSelected((route) => ({ ...route, robotBindings: route.robotBindings.map((item, index) => index === bindingIndex ? { ...item, robotProgramId: value ?? "", requiredWorkcellCapabilityCode: options.robotPrograms.find((candidate) => candidate.id === value)?.workcellCapabilityCodes[0] ?? item.requiredWorkcellCapabilityCode } : item) }))} disabled={isSubmitting}><SelectTrigger className="w-full"><SelectValue>{program ? `${program.name} — ${program.code}` : "Chọn chương trình"}</SelectValue></SelectTrigger><SelectContent>{options.robotPrograms.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} — {item.code}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>Năng lực trạm</Label><Select value={binding.requiredWorkcellCapabilityCode} onValueChange={(value) => updateSelected((route) => ({ ...route, robotBindings: route.robotBindings.map((item, index) => index === bindingIndex ? { ...item, requiredWorkcellCapabilityCode: value ?? "" } : item) }))} disabled={isSubmitting}><SelectTrigger className="w-full"><SelectValue>{binding.requiredWorkcellCapabilityCode || "Chọn năng lực"}</SelectValue></SelectTrigger><SelectContent>{bindingCapabilities.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}</SelectContent></Select></div><div className="flex items-end gap-1"><Button size="icon" variant="ghost" title="Đưa liên kết lên" aria-label="Đưa liên kết lên" disabled={bindingIndex === 0 || isSubmitting} onClick={() => updateSelected((route) => ({ ...route, robotBindings: moveItem(route.robotBindings, bindingIndex, bindingIndex - 1) }))}><ArrowUp className="size-4" /></Button><Button size="icon" variant="ghost" title="Đưa liên kết xuống" aria-label="Đưa liên kết xuống" disabled={bindingIndex === selectedRoute.robotBindings.length - 1 || isSubmitting} onClick={() => updateSelected((route) => ({ ...route, robotBindings: moveItem(route.robotBindings, bindingIndex, bindingIndex + 1) }))}><ArrowDown className="size-4" /></Button><Button size="icon" variant="ghost" title="Xóa liên kết" aria-label="Xóa liên kết" disabled={isSubmitting} onClick={() => updateSelected((route) => ({ ...route, robotBindings: route.robotBindings.filter((_item, index) => index !== bindingIndex) }))}><Trash2 className="size-4 text-destructive" /></Button></div></div>; })}</div>
                </div>
              </div>
            ) : (
              <div className="grid min-h-52 place-items-center rounded-md border border-dashed text-sm text-muted-foreground">Chọn hoặc thêm một tuyến để bắt đầu.</div>
            )}
          </div>
        )}

        {validation || errorMessage ? <p className="text-sm text-destructive" role="alert">{validation || errorMessage}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={requestClose} disabled={isSubmitting}>Hủy</Button>
          <Button onClick={() => void submit()} disabled={!options || routes.length === 0 || isSubmitting}>{isSubmitting ? "Đang lưu..." : `Lưu ${routes.length} tuyến`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
