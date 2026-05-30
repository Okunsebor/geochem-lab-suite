import { createFileRoute } from "@tanstack/react-router";
import {
  HeaderNav,
  HeroSection,
  TrustBarSection,
  LaboratorySection,
  SecurityComplianceSection,
  TestimonialsSection,
  FaqSection,
  CtaSection,
  FooterSection,
} from "../components/landing";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      {
        title: "UniPod GeoChem Suite — Geochemistry Laboratory · Nsuk",
      },
      {
        name: "description",
        content:
          "Welcome to the UniPod Geochemistry Laboratory at Nsuk. Register for secure access to submit samples, track analysis, and download certified reports.",
      },
    ],
  }),
} as any);

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeaderNav />
      <HeroSection />
      <TrustBarSection />
      <LaboratorySection />
      <SecurityComplianceSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
      <FooterSection />
    </div>
  );
}
