import { lazy, Suspense } from "react";

const WhatWeProvideSection = lazy(() => import("./WhatWeProvideSection"));
const AnalyticalInfrastructureSection = lazy(() => import("./AnalyticalInfrastructureSection"));
const ReasonsToChooseSection = lazy(() => import("./ReasonsToChooseSection"));
const TrustedBySection = lazy(() => import("./TrustedBySection"));
const CtaSection = lazy(() => import("./CtaSection"));
const FooterSection = lazy(() => import("./FooterSection"));

function SectionFallback() {
  return <div className="min-h-[12rem] border-t border-border/40" aria-hidden />;
}

export default function LandingDeferred() {
  return (
    <Suspense fallback={<SectionFallback />}>
      <WhatWeProvideSection />
      <AnalyticalInfrastructureSection />
      <ReasonsToChooseSection />
      <TrustedBySection />
      <CtaSection />
      <FooterSection />
    </Suspense>
  );
}
