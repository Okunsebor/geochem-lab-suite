import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import HeaderNav from "../components/landing/HeaderNav";
import HeroSection from "../components/landing/HeroSection";

const LandingDeferred = lazy(() => import("../components/landing/LandingDeferred"));

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
    links: [{ rel: "preload", href: "/branding/unipod-nsuk-entrance.png", as: "image" }],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeaderNav />
      <HeroSection />
      <Suspense
        fallback={
          <div className="min-h-[50vh]" aria-busy="true" aria-label="Loading page content" />
        }
      >
        <LandingDeferred />
      </Suspense>
    </div>
  );
}
