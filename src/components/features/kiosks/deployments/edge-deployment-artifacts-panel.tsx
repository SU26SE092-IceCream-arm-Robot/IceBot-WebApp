"use client";

import { FileCode2, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getConfigurationDeploymentArtifacts } from "@/lib/services/production/operations";
import type {
  ConfigurationDeploymentArtifactResult,
  ConfigurationDeploymentResult,
} from "@/types/production/operations";

interface EdgeDeploymentArtifactsPanelProps {
  kioskId: string;
  deployments: ConfigurationDeploymentResult[];
}

export function EdgeDeploymentArtifactsPanel({
  kioskId,
  deployments,
}: EdgeDeploymentArtifactsPanelProps) {
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<
    string | null
  >(null);
  const [artifacts, setArtifacts] = useState<
    ConfigurationDeploymentArtifactResult[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selected =
    deployments.find((item) => item.id === selectedDeploymentId) ?? null;

  const selectDeployment = async (deploymentId: string) => {
    setSelectedDeploymentId(deploymentId);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await getConfigurationDeploymentArtifacts(
        kioskId,
        deploymentId,
      );
      setArtifacts(
        result.sort((left, right) => left.runOrder - right.runOrder),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể tải artifact.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (deployments.length === 0) return null;

  return (
    <section
      className="space-y-3 rounded-lg border p-4"
      aria-label="Artifact đã triển khai xuống Edge"
    >
      <div>
        <h5 className="flex items-center gap-2 font-medium">
          <FileCode2 className="size-4" />
          Artifact trên Edge
        </h5>
        <p className="mt-1 text-xs text-muted-foreground">
          Chọn một lần triển khai để xem manifest artifact đã gửi cho execution
          endpoint.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {deployments.map((deployment) => (
          <Button
            key={deployment.id}
            size="sm"
            variant={
              selectedDeploymentId === deployment.id ? "default" : "outline"
            }
            onClick={() => void selectDeployment(deployment.id)}
          >
            Release #{deployment.releaseNumber} · {deployment.endpointCode}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Đang tải manifest...
        </p>
      ) : null}
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
      {selected && !isLoading && !errorMessage ? (
        artifacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Lần triển khai này không có artifact manifest để hiển thị.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Thứ tự</th>
                  <th className="px-3 py-2">Artifact</th>
                  <th className="px-3 py-2">Runtime / model</th>
                  <th className="px-3 py-2">Tùy chọn</th>
                  <th className="px-3 py-2">Kích thước</th>
                  <th className="px-3 py-2">Checksum</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {artifacts.map((artifact) => (
                  <tr
                    key={`${artifact.robotProgramId}-${artifact.robotArtifactId}`}
                  >
                    <td className="px-3 py-2 font-mono">{artifact.runOrder}</td>
                    <td className="px-3 py-2 font-mono">
                      {artifact.robotArtifactId}
                    </td>
                    <td className="px-3 py-2">
                      {artifact.runtimeTargetCode} · {artifact.machineModelCode}
                    </td>
                    <td className="px-3 py-2">
                      {artifact.requiredOptionCode ?? "Luôn chạy"}
                    </td>
                    <td className="px-3 py-2">
                      {(artifact.contentLengthBytes / 1024).toFixed(1)} KB
                    </td>
                    <td
                      className="max-w-48 truncate px-3 py-2 font-mono"
                      title={artifact.artifactChecksum}
                    >
                      {artifact.artifactChecksum}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </section>
  );
}
