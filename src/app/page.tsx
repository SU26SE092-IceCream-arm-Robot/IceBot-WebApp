import React from "react";
import type { Metadata } from "next";

import { EcosystemSection } from "@/components/features/service-registration/ecosystem-section";
import { HeroSection } from "@/components/features/service-registration/hero-section";
import { PartnerSection } from "@/components/features/service-registration/partner-section";
import { PublicFooter } from "@/components/features/service-registration/public-footer";
import { PublicHeader } from "@/components/features/service-registration/public-header";
import { RegistrationSection } from "@/components/features/service-registration/registration-section";
import { ValueSection } from "@/components/features/service-registration/value-section";
import { WorkflowSection } from "@/components/features/service-registration/workflow-section";

export const metadata: Metadata = {
  title: "IceBot | Nền tảng bán kem tự động thông minh",
  description:
    "IceBot là nền tảng quản trị và vận hành chuỗi kiosk bán kem tự động kết hợp cánh tay robot và IoT thông minh.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/20">
      <PublicHeader />
      <main className="flex-grow">
        <HeroSection />
        <ValueSection />
        <WorkflowSection />
        <PartnerSection />
        <EcosystemSection />
        <RegistrationSection />
      </main>
      <PublicFooter />
    </div>
  );
}
