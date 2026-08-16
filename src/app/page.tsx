import { ServiceRegistrationForm } from "@/components/features/landing/service-registration-form";

export const metadata = {
  title: "Đăng ký Dịch vụ | IceBot",
  description: "Đăng ký triển khai điểm bán robot kem tự động IceBot",
};

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <ServiceRegistrationForm />
      </div>
    </main>
  );
}
