import { Construction } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ModulePlaceholderProps {
  title: string;
  description: string;
}

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <div className="space-y-7">
      <section className="border-b border-border pb-6">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </section>

      <Card className="border-border/80 bg-card shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Construction className="size-5" />
            </span>
            <div className="space-y-1">
              <CardTitle className="text-base">Module đang được phát triển</CardTitle>
              <CardDescription>
                Chức năng chi tiết sẽ được bổ sung trong các phiên bản tiếp theo.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <CardDescription>
            Các thao tác nghiệp vụ sẽ xuất hiện tại đây khi phạm vi sản phẩm được mở rộng.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
