import { createFileRoute } from "@tanstack/react-router";
import {
  HeaderNav,
  HeroSection,
  WorkflowStorytelling,
  ModulesSection,
  PlatformSection,
  CtaSection,
  FooterSection,
} from "../components/landing";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "GeoChem Suite — Enterprise LIMS for Modern Labs" },
      { name: "description", content: "GeoChem Suite is a modern Laboratory Information Management System for geochemical analysis — sample intake to report delivery in one workflow." },
    ],
  }),
} as any);

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <HeaderNav />
      <HeroSection />
      <WorkflowStorytelling />
      <ModulesSection />
      <PlatformSection />
      <CtaSection />
      <FooterSection />
    </div>
  );
}
