"use client";

import {
  Check,
  Circle,
  Link2,
  ListTree,
  Rocket,
  Send,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProductionWorkflowStep = 1 | 2 | 3 | 4;

interface ProductionWorkflowStepperProps {
  currentStep: ProductionWorkflowStep | null;
  completedSteps: ProductionWorkflowStep[];
  organizationName?: string | null;
}

const STEPS = [
  {
    number: 1 as const,
    title: "Robot Programs",
    description: "Nhập bundle, tạo program, sắp thứ tự và phát hành tài nguyên.",
    icon: Upload,
  },
  {
    number: 2 as const,
    title: "Bind Configuration",
    description: "Xác nhận Recipe sử dụng Robot Program đã phát hành.",
    icon: Link2,
  },
  {
    number: 3 as const,
    title: "Phát hành cấu hình",
    description: "Snapshot các liên kết đã chọn thành một phiên bản bất biến.",
    icon: Send,
  },
  {
    number: 4 as const,
    title: "Triển khai Kiosk",
    description: "Chuyển sang Kiosk, kiểm tra endpoint và triển khai phiên bản.",
    icon: Rocket,
  },
];

export function ProductionWorkflowStepper({
  currentStep,
  completedSteps,
  organizationName,
}: ProductionWorkflowStepperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="relative" aria-label="Tiến trình cấu hình sản xuất">
      <Button
        size="sm"
        variant="outline"
        aria-expanded={isOpen}
        aria-controls="production-workflow-steps"
        onClick={() => setIsOpen((current) => !current)}
      >
        <ListTree className="size-4" />
        {isOpen ? "Ẩn luồng" : "Xem luồng"}
      </Button>
      {isOpen ? (
        <div
          id="production-workflow-steps"
          className="mt-3 rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="mb-4">
            <p className="text-sm font-semibold">Luồng cấu hình</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {organizationName
                ? `Phạm vi: ${organizationName}`
                : "Bắt đầu bằng cách chọn một tổ chức."}
            </p>
          </div>
          <ol
            className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
          >
            {STEPS.map((step) => {
                const isComplete = completedSteps.includes(step.number);
                const isCurrent = currentStep === step.number;
                const Icon = step.icon;
                return (
                  <li key={step.number} className="relative min-w-0">
                    <div
                      className={cn(
                        "flex min-h-20 gap-3 rounded-md border px-3 py-3 transition-colors",
                        isCurrent && "border-primary/40 bg-primary/5",
                        isComplete &&
                          !isCurrent &&
                          "border-success/30 bg-success/5",
                        !isCurrent &&
                          !isComplete &&
                          "border-transparent bg-muted/30",
                      )}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground",
                          isCurrent && "border-primary/40 text-primary",
                          isComplete && "border-success/40 text-success",
                        )}
                      >
                        {isComplete ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : isCurrent ? (
                          <Icon className="size-4" aria-hidden="true" />
                        ) : (
                          <Circle className="size-3" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          Bước {step.number}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                          {step.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
          </ol>
        </div>
      ) : null}
    </aside>
  );
}
