import { IceCream } from "lucide-react";

interface AuthPageShellProps {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}

export function AuthPageShell({
  children,
  eyebrow,
  title,
  description,
}: AuthPageShellProps) {
  return (
    <main className="auth-shell min-h-screen bg-background p-3 sm:p-8">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1fr)_30rem]">
        <section className="flex flex-col border-b border-border bg-secondary/35 p-5 sm:p-8 lg:justify-between lg:border-r lg:border-b-0 lg:p-10">
          <div className="flex items-center gap-3 text-foreground">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:size-11">
              <IceCream className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">ICEBOT</span>
          </div>
          <div className="mt-7 max-w-lg sm:mt-10 lg:my-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:text-sm">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:mt-3 sm:text-3xl lg:mt-4 lg:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7 lg:mt-4">
              {description}
            </p>
          </div>
          <p className="hidden text-sm leading-6 text-muted-foreground lg:block">
            Chỉ sử dụng tài khoản được tổ chức của bạn cấp quyền.
          </p>
        </section>
        <section className="flex items-center p-5 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}
