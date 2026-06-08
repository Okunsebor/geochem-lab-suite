import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { LandingSectionHeader } from "./shared/LandingSectionHeader";
import { BRAND_ASSETS } from "@/lib/branding";
import { OptimizedImage } from "@/components/shared/OptimizedImage";

const REASONS = [
  {
    id: "expertise",
    label: "Academic Excellence",
    title: "Academic excellence & research",
    bullets: [
      "State-of-the-art geochemical apparatus at UniPod Hub",
      "High-performance compute clusters and database infrastructure",
      "Synergistic research programs with federal and state agencies",
    ],
    image: BRAND_ASSETS.labInterior,
    imageAlt: "UniPod geochemistry laboratory",
  },
  {
    id: "quality",
    label: "Accredited Frameworks",
    title: "Accredited frameworks & standards",
    bullets: [
      "ISO 17025-ready quality systems and data validation",
      "Immutable audit ledgers verifying specimen data custody",
      "Multi-signatory approval processes for verified academic output",
    ],
    image: BRAND_ASSETS.samplePrepLab,
    imageAlt: "Sample preparation laboratory",
  },
  {
    id: "reliability",
    label: "Restricted Access",
    title: "Restricted enterprise access control",
    bullets: [
      "Role-based verification for accredited researchers",
      "Isolated internal data storage protecting proprietary assets",
      "Multi-factor cryptographic authentication protocols",
    ],
    image: BRAND_ASSETS.entrance,
    imageAlt: "UniPod Nsuk facility entrance",
  },
  {
    id: "commitment",
    label: "Global Innovation",
    title: "Global innovation standards",
    bullets: [
      "Outcome-driven precision engineered for national growth",
      "Backed by development partners (UNDP, GIZ, and GFG)",
      "Pioneering the public university research ecosystem",
    ],
    image: BRAND_ASSETS.valueProposition,
    imageAlt: "UniPod value proposition slide mapping",
  },
];

export default function ReasonsToChooseSection() {
  const [active, setActive] = useState(0);
  const current = REASONS[active];

  return (
    <section id="reasons" className="border-t border-border bg-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <LandingSectionHeader
          eyebrow="Trust & Standards"
          title="The Standard Others Measure Against."
          subtitle="GeoChem Suite operates under institutional frameworks trusted by federal agencies, university research programs, and enterprise partners across Nigeria and beyond."
        />

        <div className="grid gap-10 lg:grid-cols-12 items-stretch">
          {/* Tabs */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {REASONS.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActive(i)}
                className={`shrink-0 text-left rounded-xl px-5 py-4 text-sm font-bold transition-all duration-200 ease-out border ${
                  active === i
                    ? "bg-primary text-black border-transparent shadow-lg shadow-primary/25"
                    : "bg-card border-border text-muted-foreground hover:bg-primary hover:text-black hover:border-transparent hover:-translate-y-[2px] hover:shadow-md active:shadow-[0_0_0_3px_rgba(0,174,239,0.25),0_0_20px_rgba(0,174,239,0.55)]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div className="lg:col-span-8 grid md:grid-cols-2 gap-6 items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.35 }}
                className="space-y-5"
              >
                <h3 className="text-2xl font-extrabold font-display text-foreground">
                  {current.title}
                </h3>
                <ul className="space-y-3">
                  {current.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            <motion.div
              key={`img-${current.id}`}
              initial={{ opacity: 0, scale: 0.96, rotateY: -6 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.45 }}
              className="landing-3d-panel relative rounded-2xl overflow-hidden border border-border shadow-xl h-64 md:h-80"
            >
              <OptimizedImage
                src={current.image}
                alt={current.imageAlt}
                className="w-full h-full object-cover"
                width={800}
                height={600}
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/50 to-transparent pointer-events-none"
                aria-hidden
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
