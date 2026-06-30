"use client";

import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PermissionMatrixResult } from "@/types/accounts";

export function PermissionMatrixView({ matrix }: { matrix: PermissionMatrixResult }) {
  if (matrix.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
        <p>Không có dữ liệu ma trận phân quyền.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {matrix.map((group) => (
        <Card key={group.groupName} className="flex flex-col h-full border-border/50 shadow-sm">
          <CardHeader className="pb-3 bg-muted/20 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {group.groupName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-full max-h-[300px]">
              <div className="flex flex-col divide-y">
                {group.permissions.map((perm) => (
                  <div key={perm.code} className="p-4 flex flex-col gap-1.5 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{perm.name}</span>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider shrink-0 bg-background">
                        {perm.code}
                      </Badge>
                    </div>
                    {perm.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {perm.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
