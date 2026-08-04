"use client";

import { FileCode2, GripVertical, Save, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRobotProgram, getRobotProgram, importRawLuaRobotProgramArtifacts, listRobotPrograms, replaceRobotProgramArtifacts } from "@/lib/services/production-operations";
import type { RobotProgramResult } from "@/types/production-operations";

interface RawLuaProgramImportPanelProps {
  organizationId: string;
  canManage: boolean;
  embedded?: boolean;
}

const NEW_PROGRAM = "__new_program__";

function createProgramSuggestion(fileName: string) {
  const stem = fileName.replace(/\.(lua|zip)$/i, "").trim();
  const code = stem
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 100) || "RAW-LUA-PROGRAM";
  const name = stem.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || "Raw Lua program";
  return { code, name };
}

function inferTarget(program: RobotProgramResult) {
  const targets = program.artifacts
    .filter((artifact) => artifact.runtimeTargetCode && artifact.machineModelCode)
    .map((artifact) => `${artifact.runtimeTargetCode}\u0000${artifact.machineModelCode}`);
  if (targets.length !== program.artifacts.length || new Set(targets).size !== 1) return null;

  const [runtimeTargetCode, machineModelCode] = targets[0].split("\u0000");
  return { runtimeTargetCode, machineModelCode };
}

function reorder<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function RawLuaProgramImportPanel({ organizationId, canManage, embedded = false }: RawLuaProgramImportPanelProps) {
  const [programs, setPrograms] = useState<RobotProgramResult[]>([]);
  const [programId, setProgramId] = useState("");
  const [program, setProgram] = useState<RobotProgramResult | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [runtimeTargetCode, setRuntimeTargetCode] = useState("");
  const [machineModelCode, setMachineModelCode] = useState("");
  const [newProgramCode, setNewProgramCode] = useState("");
  const [newProgramName, setNewProgramName] = useState("");
  const [draggedArtifactId, setDraggedArtifactId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftPrograms = useMemo(() => programs.filter((item) => item.status === "Draft"), [programs]);
  const createsProgram = programId === NEW_PROGRAM;

  const refreshPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await listRobotPrograms(organizationId);
      setPrograms(next);
      return next;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cannot load draft robot programs.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void refreshPrograms(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshPrograms]);

  const selectProgram = async (value: string) => {
    setError(null);
    setProgramId(value);
    if (!value || value === NEW_PROGRAM) {
      setProgram(null);
      setRuntimeTargetCode("");
      setMachineModelCode("");
      if (value === NEW_PROGRAM && files.length > 0) {
        const suggestion = createProgramSuggestion(files[0].name);
        setNewProgramCode((current) => current || suggestion.code);
        setNewProgramName((current) => current || suggestion.name);
      }
      return;
    }
    setIsLoading(true);
    try {
      const selectedProgram = await getRobotProgram(organizationId, value);
      setProgram(selectedProgram);
      const target = inferTarget(selectedProgram);
      setRuntimeTargetCode(target?.runtimeTargetCode ?? "");
      setMachineModelCode(target?.machineModelCode ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cannot load selected robot program.");
      setProgram(null);
    } finally {
      setIsLoading(false);
    }
  };

  const selectFiles = (selected: FileList | null) => {
    if (!selected) return;
    const next = Array.from(selected);
    const archives = next.filter((file) => file.name.toLowerCase().endsWith(".zip"));
    const invalid = next.filter((file) => !file.name.toLowerCase().endsWith(".lua") && !file.name.toLowerCase().endsWith(".zip"));
    if (invalid.length > 0 || archives.length > 1 || (archives.length === 1 && next.length !== 1)) {
      setError("Choose one raw ZIP archive or one or more .lua files.");
      return;
    }
    setError(null);
    setFiles(next);
    if (createsProgram && next.length > 0) {
      const suggestion = createProgramSuggestion(next[0].name);
      setNewProgramCode((current) => current || suggestion.code);
      setNewProgramName((current) => current || suggestion.name);
    }
  };

  const importFiles = async () => {
    if (!canManage || files.length === 0 || !runtimeTargetCode.trim() || !machineModelCode.trim()) {
      setError("Choose raw Lua files and provide runtime target plus machine model.");
      return;
    }
    if (!programId) {
      setError("Choose an existing draft program or create a new draft program.");
      return;
    }
    if (createsProgram && (!newProgramCode.trim() || !newProgramName.trim())) {
      setError("Program code and name are required when creating a draft program.");
      return;
    }

    setIsMutating(true);
    setError(null);
    try {
      const target = createsProgram
        ? await createRobotProgram(organizationId, { code: newProgramCode, name: newProgramName })
        : program;
      if (!target) throw new Error("Cannot resolve the draft robot program.");
      const result = await importRawLuaRobotProgramArtifacts(organizationId, target.id, {
        files,
        runtimeTargetCode,
        machineModelCode,
      });
      if (!result.program) {
        throw new Error("Raw files were staged as artifact drafts but were not appended. Fix failed files, then retry the same import.");
      }

      setProgram(result.program);
      setProgramId(result.program.id);
      setFiles([]);
      setPrograms((current) => [...current.filter((item) => item.id !== result.program!.id), result.program!]
        .sort((left, right) => left.code.localeCompare(right.code)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cannot import raw Lua files.");
    } finally {
      setIsMutating(false);
    }
  };

  const saveOrder = async () => {
    if (!program || program.status !== "Draft") return;
    setIsMutating(true);
    setError(null);
    try {
      const updated = await replaceRobotProgramArtifacts(organizationId, program.id, {
        expectedLastModifiedAt: program.lastModifiedAt,
        artifacts: program.artifacts.map((artifact, index) => ({
          robotArtifactId: artifact.robotArtifactId,
          runOrder: index + 1,
          parametersJson: artifact.parametersJson,
          requiredOptionCode: artifact.requiredOptionCode,
        })),
      });
      setProgram(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cannot save artifact order.");
    } finally {
      setIsMutating(false);
    }
  };

  if (!canManage) return null;

  return (
    <section className={embedded ? "space-y-4" : "space-y-4 rounded-lg border bg-card p-4"} aria-label="Raw Lua program import">
      {!embedded ? <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary"><FileCode2 className="size-4" /></span>
        <div><h2 className="font-semibold">Raw Lua vao Program Draft</h2><p className="mt-1 text-sm text-muted-foreground">Dung cho Lua legacy hoac file le. Bundle Fairino co manifest va contract van dung luong nhap chuan o tren.</p></div>
      </div> : null}
      {error ? <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2"><Label>Program Draft</Label><Select value={programId} onValueChange={(value) => void selectProgram(value ?? "")} disabled={isLoading || isMutating}><SelectTrigger className="w-full"><SelectValue>{isLoading ? "Loading..." : "Choose Draft program"}</SelectValue></SelectTrigger><SelectContent>{draftPrograms.map((item) => <SelectItem key={item.id} value={item.id}>{item.code} - {item.name}</SelectItem>)}<SelectItem value={NEW_PROGRAM}>Create new Draft program</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Lua files or raw ZIP</Label><Input type="file" accept=".lua,.zip" multiple onChange={(event) => selectFiles(event.target.files)} disabled={isMutating} /></div>
        <div className="space-y-2"><Label>Runtime target</Label><Input value={runtimeTargetCode} onChange={(event) => setRuntimeTargetCode(event.target.value)} placeholder="Selected Draft determines this when possible" disabled={isMutating} /></div>
        <div className="space-y-2"><Label>Machine model</Label><Input value={machineModelCode} onChange={(event) => setMachineModelCode(event.target.value)} placeholder="Selected Draft determines this when possible" disabled={isMutating} /></div>
        {createsProgram ? <><div className="space-y-2"><Label>New program code</Label><Input value={newProgramCode} onChange={(event) => setNewProgramCode(event.target.value)} placeholder="VANILLA-SOFT-SERVE" disabled={isMutating} /></div><div className="space-y-2"><Label>New program name</Label><Input value={newProgramName} onChange={(event) => setNewProgramName(event.target.value)} placeholder="Vanilla soft serve" disabled={isMutating} /></div></> : null}
      </div>
      {files.length > 0 ? <div className="rounded-md border p-3 text-sm"><p className="font-medium">Initial run order</p><p className="mt-1 text-xs text-muted-foreground">For individual files, the selected file order is appended. For a raw ZIP, backend preserves ZIP entry order; reorder after import if needed.</p><ol className="mt-3 space-y-1">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{index + 1}</span><span className="truncate">{file.name}</span></li>)}</ol></div> : null}
      <Button disabled={isMutating || files.length === 0} onClick={() => void importFiles()}><Upload className="size-4" />{isMutating ? "Importing..." : "Import raw Lua"}</Button>

      {program ? <div className="space-y-3 border-t pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">Run order: {program.code}</p><p className="text-xs text-muted-foreground">Drag an artifact, then save the order. Published programs cannot be reordered.</p></div><Button size="sm" variant="outline" disabled={isMutating || program.artifacts.length < 2} onClick={() => void saveOrder()}><Save className="size-4" />Save order</Button></div>{program.artifacts.length === 0 ? <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">No artifacts in this draft program yet.</p> : <ol className="divide-y rounded-md border">{program.artifacts.map((artifact, index) => <li key={artifact.id} draggable={!isMutating} onDragStart={() => setDraggedArtifactId(artifact.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (!draggedArtifactId || draggedArtifactId === artifact.id) return; const fromIndex = program.artifacts.findIndex((item) => item.id === draggedArtifactId); if (fromIndex < 0) return; setProgram({ ...program, artifacts: reorder(program.artifacts, fromIndex, index).map((item, order) => ({ ...item, runOrder: order + 1 })) }); setDraggedArtifactId(null); }} className="flex cursor-grab items-center gap-3 px-3 py-2 active:cursor-grabbing"><GripVertical className="size-4 text-muted-foreground" /><span className="w-5 font-mono text-xs text-muted-foreground">{index + 1}</span><div className="min-w-0"><p className="truncate font-medium">{artifact.artifactName ?? artifact.artifactCode ?? artifact.robotArtifactId}</p><p className="truncate font-mono text-xs text-muted-foreground">{artifact.artifactCode ?? artifact.robotArtifactId}</p></div></li>)}</ol>}</div> : null}
    </section>
  );
}
