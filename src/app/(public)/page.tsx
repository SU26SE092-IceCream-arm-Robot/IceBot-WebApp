import React from 'react';
import { Metadata } from 'next';
import { PublicHeader } from '@/components/features/service-registration/public-header';
import { HeroSection } from '@/components/features/service-registration/hero-section';
import { ValueSection } from '@/components/features/service-registration/value-section';
import { WorkflowSection } from '@/components/features/service-registration/workflow-section';
import { PartnerSection } from '@/components/features/service-registration/partner-section';
import { EcosystemSection } from '@/components/features/service-registration/ecosystem-section';
import { RegistrationSection } from '@/components/features/service-registration/registration-section';
import { PublicFooter } from '@/components/features/service-registration/public-footer';

export const metadata: Metadata = {
  title: 'IceBot | Automated Ice Cream Vending Platform',
  description: 'IceBot is a multi-location automated ice cream vending platform integrating customer kiosks, centralized management, IoT and robotic-arm automation.',
};

export default function RegisterServicePage() {
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
