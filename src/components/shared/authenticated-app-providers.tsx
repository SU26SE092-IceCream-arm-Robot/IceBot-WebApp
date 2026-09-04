"use client";

import type { ReactNode } from "react";

import { QueryProvider } from "@/components/shared/query-provider";
import { AuthProvider } from "@/hooks/identity/use-auth";

export function AuthenticatedAppProviders({ children }: { children: ReactNode }) {
  return <QueryProvider><AuthProvider>{children}</AuthProvider></QueryProvider>;
}
