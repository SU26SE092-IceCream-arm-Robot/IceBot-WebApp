"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { READINESS_GROUP_LABELS } from "@/lib/readiness/readiness-labels";
import type { ReadinessCheck, ReadinessCheckGroup } from "@/types/setup-readiness";

import { ReadinessCheckItem } from "./readiness-check-item";

interface ReadinessCheckGroupProps {
  group: ReadinessCheckGroup;
  checks: ReadinessCheck[];
}

export function ReadinessCheckGroup({ group, checks }: ReadinessCheckGroupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{READINESS_GROUP_LABELS[group]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map((check) => (
          <ReadinessCheckItem key={check.id} check={check} />
        ))}
      </CardContent>
    </Card>
  );
}
