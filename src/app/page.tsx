import React from "react";
import type { Metadata } from "next";

import { EcosystemSection } from "@/components/features/service-registration/ecosystem-section";
import { HeroSection } from "@/components/features/service-registration/hero-section";
import { LandingMotionController } from "@/components/features/service-registration/landing-motion-controller";
import { PartnerSection } from "@/components/features/service-registration/partner-section";
import { PublicFooter } from "@/components/features/service-registration/public-footer";
import { PublicHeader } from "@/components/features/service-registration/public-header";
import { RegistrationSection } from "@/components/features/service-registration/registration-section";
import { ValueSection } from "@/components/features/service-registration/value-section";
import { WorkflowSection } from "@/components/features/service-registration/workflow-section";

export const metadata: Metadata = {
  title: "IceBot | Từ workflow mô phỏng đến điểm bán robot",
  description:
    "Thiết kế workflow với FaiRobot Studio và triển khai mô hình bán hàng tự động trên nền tảng quản trị IceBot.",
};

export default function HomePage() {
  return (
    <LandingMotionController>
      <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/20">
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[60] rounded-md bg-[#175CD3] px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white"
        >
          Bỏ qua điều hướng, tới nội dung chính
        </a>
        <PublicHeader />
        <main id="main-content" className="flex-grow" tabIndex={-1}>
          <HeroSection />
          <ValueSection />
          <WorkflowSection />
          <PartnerSection />
          <EcosystemSection />
          <RegistrationSection />
        </main>
        <PublicFooter />
      </div>
    </LandingMotionController>
  );
}
