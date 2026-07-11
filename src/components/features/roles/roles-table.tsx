"use client";

import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ManagementRoleResult } from "@/types/accounts";

const ROLE_NAME_LABELS: Record<string, string> = {
  Admin: "Quản trị viên",
  SystemAdmin: "Quản trị hệ thống",
  Manager: "Quản lý",
  OrgAdmin: "Quản trị tổ chức",
  LocationOwner: "Quản lý địa điểm",
  Staff: "Nhân viên",
  Technician: "Kỹ thuật viên",
};

export function RolesTable({ roles }: { roles: ManagementRoleResult[] }) {
  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
        <p>Không có dữ liệu vai trò.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[150px]">Mã vai trò</TableHead>
            <TableHead className="w-[200px]">Tên vai trò</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead className="text-center w-[120px]">Phạm vi</TableHead>
            <TableHead className="text-center w-[120px]">Hệ thống</TableHead>
            <TableHead className="text-center w-[120px]">Có thể gán</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.code} className="hover:bg-muted/30">
              <TableCell className="font-medium">
                <Badge variant="outline" className="font-mono text-xs">
                  {role.code}
                </Badge>
              </TableCell>
              <TableCell>{ROLE_NAME_LABELS[role.code] ?? role.name}</TableCell>
              <TableCell className="text-muted-foreground max-w-[300px] truncate">
                {role.description || "-"}
              </TableCell>
              <TableCell className="text-center">
                {role.requiresScope ? (
                  <Badge variant="secondary" className="text-xs">
                    Có
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {role.isSystemRole ? (
                  <Check className="mx-auto h-4 w-4 text-primary" />
                ) : (
                  <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
                )}
              </TableCell>
              <TableCell className="text-center">
                {role.isAssignable ? (
                  <Check className="mx-auto h-4 w-4 text-success" />
                ) : (
                  <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
