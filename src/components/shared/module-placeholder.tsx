import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ModulePlaceholderProps {
  title: string;
  description: string;
}

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module đang được phát triển</CardTitle>
          <CardDescription>
            Phase hiện tại chỉ dựng dashboard foundation, chưa triển khai nghiệp vụ chi tiết.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tiếp theo sẽ áp dụng kiến trúc mock-first: Page - Hook - Service - Mock Data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
