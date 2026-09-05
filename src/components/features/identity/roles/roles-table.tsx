"use client";

import { Shield, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ManagementRoleResult,
  ManagementScopeType,
} from "@/types/identity/accounts";

const SCOPE_LABELS: Record<ManagementScopeType, string> = {
  Global: "Toàn hệ thống",
  Organization: "Tổ chức",
  Store: "Cửa hàng",
  Kiosk: "Kiosk",
  Device: "Thiết bị",
};

function RoleScope({ role }: { role: ManagementRoleResult }) {
  if (!role.requiresScope) {
    return (
      <span className="text-sm font-medium text-foreground">
        Không yêu cầu phạm vi
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {role.allowedScopeTypes.length > 0 ? (
        role.allowedScopeTypes.map((scope) => (
          <Badge key={`${role.code}-${scope}`} variant="outline">
            {SCOPE_LABELS[scope]}
          </Badge>
        ))
      ) : (
        <span className="text-sm text-muted-foreground">
          Theo phạm vi được phân công
        </span>
      )}
    </div>
  );
}

export function RolesTable({ roles }: { roles: ManagementRoleResult[] }) {
  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 p-10 text-center">
        <Shield className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-foreground">
          Chưa có role hệ thống
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Danh sách role sẽ xuất hiện khi backend trả về dữ liệu phân quyền.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="divide-y divide-border md:hidden">
        {roles.map((role) => (
          <article key={role.code} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-mono text-sm font-semibold text-foreground">
                  {role.code}
                </h3>
                {role.name && role.name !== role.code ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {role.name}
                  </p>
                ) : null}
              </div>
              <Badge variant={role.isSystemRole ? "default" : "secondary"}>
                {role.isSystemRole ? "Hệ thống" : "Nghiệp vụ"}
              </Badge>
            </div>
            {role.description ? (
              <p className="text-sm leading-6 text-muted-foreground">
                {role.description}
              </p>
            ) : null}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                Phạm vi có thể phân công
              </p>
              <RoleScope role={role} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[780px] table-fixed">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[22%] px-4">Role hệ thống</TableHead>
              <TableHead className="w-[35%]">Mô tả từ hệ thống</TableHead>
              <TableHead className="w-[30%]">
                Phạm vi có thể phân công
              </TableHead>
              <TableHead className="w-[13%] px-4">Loại role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.code}>
                <TableCell className="px-4 py-3 align-top">
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {role.code}
                  </p>
                  {role.name && role.name !== role.code ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {role.name}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="py-3 align-top text-sm leading-6 text-muted-foreground">
                  {role.description || "Chưa có mô tả từ hệ thống."}
                </TableCell>
                <TableCell className="py-3 align-top">
                  <RoleScope role={role} />
                </TableCell>
                <TableCell className="px-4 py-3 align-top">
                  <Badge variant={role.isSystemRole ? "default" : "secondary"}>
                    {role.isSystemRole ? "Hệ thống" : "Nghiệp vụ"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
