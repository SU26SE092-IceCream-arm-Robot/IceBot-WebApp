"use client";

import { Link2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProductionProgramBinding,
  getConfigurationReleaseAuthoringOptions,
  listProductionProgramBindings,
  retireProductionProgramBinding,
} from "@/lib/services/production-operations";
import type {
  ConfigurationReleaseAuthoringOptions,
  ProductionProgramBindingResult,
} from "@/types/production-operations";

export function ProductionProgramBindingsPanel({
  organizationId,
  canManage,
}: {
  organizationId: string;
  canManage: boolean;
}) {
  const [options, setOptions] =
    useState<ConfigurationReleaseAuthoringOptions | null>(null);
  const [bindings, setBindings] = useState<ProductionProgramBindingResult[]>(
    [],
  );
  const [recipeId, setRecipeId] = useState("");
  const [programId, setProgramId] = useState("");
  const [capability, setCapability] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [nextOptions, nextBindings] = await Promise.all([
        getConfigurationReleaseAuthoringOptions(organizationId),
        listProductionProgramBindings(organizationId),
      ]);
      setOptions(nextOptions);
      setBindings(nextBindings);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể tải liên kết sản xuất.",
      );
    } finally {
      setBusy(false);
    }
  }, [organizationId]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const recipe = options?.recipes.find((item) => item.id === recipeId);
  const program = options?.robotPrograms.find((item) => item.id === programId);
  const capabilityOptions = useMemo(
    () =>
      program?.workcellCapabilityCodes ??
      options?.workcellCapabilities.map((item) => item.code) ??
      [],
    [options, program],
  );
  const create = async () => {
    if (!recipe || !program || !capability) return;
    setBusy(true);
    setError(null);
    try {
      await createProductionProgramBinding(organizationId, {
        recipeId,
        robotProgramId: programId,
        requiredWorkcellCapabilityCode: capability,
        supportedOptionCodes: recipe.productionOptionCandidates
          .filter((option) => option.isAvailable)
          .map((option) => option.code),
      });
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể tạo liên kết.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border bg-card">
      <header className="flex items-start justify-between gap-3 border-b p-4">
        <div className="flex gap-3">
          <span className="flex size-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <Link2 className="size-4" />
          </span>
          <div>
            <h2 className="font-semibold">Liên kết Recipe và chương trình</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tạo một bằng chứng tương thích bất biến giữa Recipe, option policy
              và Robot Program đã phát hành.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void load()}
          disabled={busy}
        >
          <RefreshCw className="size-4" /> Làm mới
        </Button>
      </header>
      {error ? (
        <p
          role="alert"
          className="m-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      {canManage ? (
        <div className="grid gap-4 border-b p-4 md:grid-cols-3">
          <div>
            <Label>Recipe</Label>
            <Select
              value={recipeId}
              onValueChange={(value) => setRecipeId(value ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn Recipe" />
              </SelectTrigger>
              <SelectContent>
                {options?.recipes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.productName} / {item.productVariantName} / {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Robot Program</Label>
            <Select
              value={programId}
              onValueChange={(value) => {
                const nextProgramId = value ?? "";
                const nextProgram = options?.robotPrograms.find(
                  (item) => item.id === nextProgramId,
                );
                const capabilities = nextProgram?.workcellCapabilityCodes ?? [];
                setProgramId(nextProgramId);
                setCapability(capabilities.length === 1 ? capabilities[0] : "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chương trình đã phát hành" />
              </SelectTrigger>
              <SelectContent>
                {options?.robotPrograms.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} / {item.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Môi trường chạy</Label>
            {capabilityOptions.length === 1 ? (
              <p className="mt-1.5 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                {capabilityOptions[0]}
              </p>
            ) : capabilityOptions.length > 1 ? (
              <Select
                value={capability}
                onValueChange={(value) => setCapability(value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn môi trường tương thích" />
                </SelectTrigger>
                <SelectContent>
                  {capabilityOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="mt-1.5 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
                Chương trình chưa công bố môi trường chạy tương thích.
              </p>
            )}
          </div>
          <div className="md:col-span-3">
            <Button
              onClick={() => void create()}
              disabled={busy || !recipe || !program || !capability}
            >
              Tạo liên kết
            </Button>
          </div>
        </div>
      ) : null}
      <div className="divide-y">
        {bindings.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Chưa có liên kết Recipe và Robot Program.
          </p>
        ) : (
          bindings.map((binding) => (
            <div
              key={binding.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-medium">
                  {options?.recipes.find((item) => item.id === binding.recipeId)
                    ?.name ?? binding.recipeId}{" "}
                  →{" "}
                  {options?.robotPrograms.find(
                    (item) => item.id === binding.robotProgramId,
                  )?.name ?? binding.robotProgramId}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recipe v{binding.recipeVersion} ·{" "}
                  {binding.requiredWorkcellCapabilityCode} · {binding.status}
                </p>
              </div>
              {canManage && binding.status === "Active" ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm("Ngừng dùng liên kết này cho release mới?")
                    )
                      void retireProductionProgramBinding(
                        organizationId,
                        binding.id,
                      )
                        .then(load)
                        .catch((reason) =>
                          setError(
                            reason instanceof Error
                              ? reason.message
                              : "Không thể ngừng liên kết.",
                          ),
                        );
                  }}
                >
                  Ngừng dùng
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
