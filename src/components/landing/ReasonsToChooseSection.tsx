import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { LandingSectionHeader } from "./shared/LandingSectionHeader";
import { BRAND_ASSETS } from "@/lib/branding";
import { OptimizedImage } from "@/components/shared/OptimizedImage";

const REASONS = [
  {
    id: "expertise",
    label: "Expertise & experience",
    title: "Expertise and experience",
    bullets: [
      "Paperless workflows for a digital-first laboratory",
      "Technologically advanced geochemical operations",
      "UniPod Innovation Hub at NSUK",
    ],
    image: BRAND_ASSETS.labInterior,
    imageAlt: "UniPod geochemistry laboratory",
  },
  {
    id: "quality",
    label: "Quality & integrity",
    title: "Quality & integrity",
    bullets: [
      "ISO 17025-ready QA/QC checkpoints",
      "Chain-of-custody and audit trails",
      "Regulatory-minded report approval flows",
    ],
    image: BRAND_ASSETS.entrance,
    imageAlt: "UniPod Nsuk facility",
  },
  {
    id: "reliability",
    label: "Reliability",
    title: "Reliability and consistency",
    bullets: [
      "360 LIMS and customer portal coverage",
      "Role-based access for every stakeholder",
      "Real-time specimen status visibility",
    ],
    image: BRAND_ASSETS.labInterior,
    imageAlt: "Laboratory operations",
  },
  {
    id: "commitment",
    label: "Commitment",
    title: "Commitment & excellence",
    bullets: [
      "Result-driven turnaround improvements",
      "Premium certificates and client experience",
      "Dedicated coordinator and admin portals",
    ],
    image: BRAND_ASSETS.entrance,
    imageAlt: "UniPod commitment",
  },
];

const VALUE_SEGMENTS = [
  { num: "01", title: "Close the R&D gap", side: "left" as const },
  { num: "02", title: "Nurture future talent", side: "left" as const },
  { num: "03", title: "Public university excellence", side: "right" as const },
  { num: "04", title: "Institutional co-creation", side: "right" as const },
];

export default function ReasonsToChooseSection() {
  const [active, setActive] = useState(0);
  const current = REASONS[active];

  return (
    <section id="reasons" className="border-t border-border bg-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <LandingSectionHeader
          eyebrow="Reasons to choose"
          title="Why labs & brands love to choose us, recurrently"
          />

        {/* Value proposition ring  inspired by UniPod slide */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-16 hidden lg:grid grid-cols-[1fr_auto_1fr] gap-8 items-center max-w-5xl mx-auto"
        >
          <div className="space-y-10 text-right">
            {VALUE_SEGMENTS.filter((s) => s.side === "left").map((s) => (
              <div key={s.num}>
                <p className="text-xs font-mono text-accent font-bold">{s.num}</p>
                <p className="text-sm font-bold text-foreground mt-1">{s.title}</p>
              </div>
            ))}
          </div>
          <div className="landing-value-ring relative size-52 shrink-0">
            <div className="landing-value-ring-inner flex items-center justify-center text-center p-6">
              <p className="text-xs font-bold font-display text-foreground leading-snug">
                UniPod<br />
                <span className="text-primary">Value</span>
              </p>
            </div>
          </div>
          <div className="space-y-10 text-left">
            {VALUE_SEGMENTS.filter((s) => s.side === "right").map((s) => (
              <div key={s.num}>
                <p className="text-xs font-mono text-accent font-bold">{s.num}</p>
                <p className="text-sm font-bold text-foreground mt-1">{s.title}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-12 items-stretch">
          {/* Tabs */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {REASONS.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActive(i)}
                className={`shrink-0 text-left rounded-xl px-5 py-4 text-sm font-bold transition-all duration-300 border ${
                  active === i
                    ? "gradient-primary text-white border-transparent shadow-lg shadow-primary/25"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
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
                <h3 className="text-2xl font-extrabold font-display text-foreground">{current.title}</h3>
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/50 to-transparent pointer-events-none" aria-hidden />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
