import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex max-w-md flex-col items-center gap-6">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-muted/50 text-muted-foreground shadow-sm ring-1 ring-border">
          <SearchX className="size-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            404
          </h1>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Không tìm thấy trang
          </h2>
          <p className="text-base text-muted-foreground">
            Đường dẫn bạn yêu cầu không tồn tại, có thể đã bị xóa hoặc thay đổi. Vui lòng kiểm tra lại.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}>
            <Home className="mr-2 size-4" />
            Về trang chủ
          </Link>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
            <ArrowLeft className="mr-2 size-4" />
            Quay lại
          </Link>
        </div>
      </div>
    </main>
  );
}
