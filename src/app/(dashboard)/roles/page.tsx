"use client";

import { RefreshCw, ShieldAlert } from "lucide-react";

import { PermissionMatrixView } from "@/components/features/roles/permission-matrix-view";
import { RolesTable } from "@/components/features/roles/roles-table";
import { Button } from "@/components/ui/button";
import { useRoles } from "@/hooks/use-roles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RolesPage() {
  const { roles, permissionMatrix, isLoading, errorMessage, refresh } = useRoles();

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vai Trò & Quyền Hạn</h2>
          <p className="text-muted-foreground mt-1">
            Danh sách vai trò và ma trận phân quyền từ hệ thống
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-md bg-destructive/15 p-4 flex items-center gap-3 border border-destructive/20 text-destructive">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Danh sách Vai trò</TabsTrigger>
          <TabsTrigger value="matrix">Ma trận Phân quyền</TabsTrigger>
        </TabsList>
        <TabsContent value="roles" className="space-y-4">
          {isLoading && roles.length === 0 ? (
            <div className="space-y-2 px-2 py-4">
              <div className="h-8 w-full animate-pulse rounded bg-muted/50" />
              <div className="h-20 w-full animate-pulse rounded bg-muted/30" />
              <div className="h-20 w-full animate-pulse rounded bg-muted/30" />
            </div>
          ) : (
            <RolesTable roles={roles} />
          )}
        </TabsContent>
        <TabsContent value="matrix" className="space-y-4">
          {isLoading && !permissionMatrix ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[250px] animate-pulse rounded-xl bg-muted/30 border" />
              ))}
            </div>
          ) : permissionMatrix ? (
            <PermissionMatrixView matrix={permissionMatrix} />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
