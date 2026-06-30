import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IceBot Admin Dashboard",
  description:
    "Trung tâm giám sát và quản lý hệ thống trạm bán kem tự động IceBot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${plusJakartaSans.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
