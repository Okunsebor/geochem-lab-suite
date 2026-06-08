import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LandingSectionHeader } from "./shared/LandingSectionHeader";

const PROVIDE_CARDS = [
  {
    imgSrc: "/capabilities/institutional-trust.png",
    title: "Institutional Governance.",
    description:
      "Built on ISO-compliant frameworks with full role-based access control. Every action is verified, logged, and accountable to your institutional standards.",
  },
  {
    imgSrc: "/capabilities/research-infrastructure.png",
    title: "Advanced Analytical Infrastructure.",
    description:
      "State-of-the-art instruments housed within Nasarawa State University's UniPod Innovation Hub, engineered for reproducible, publication-grade results.",
  },
  {
    imgSrc: "/capabilities/confidential.png",
    title: "Confidential Data Pathways.",
    description:
      "Restricted data pipelines protect your proprietary findings at every stage, ensuring full client confidentiality and regulatory compliance from intake to delivery.",
  },
  {
    imgSrc: "/capabilities/data-security.png",
    title: "Sovereign Data Security.",
    description:
      "Immutable sample tracking with cryptographic chain-of-custody verification. Every record is tamper-proof, timestamped, and permanently auditable.",
  },
  {
    imgSrc: "/capabilities/industrial-collab.png",
    title: "Academic and Industrial Collaboration.",
    description:
      "Designed for co-creation with federal agencies, international development partners, and research institutions accelerating Africa's scientific progress.",
  },
  {
    imgSrc: "/capabilities/precision.png",
    title: "Certified Precision Outcomes.",
    description:
      "Rigorous analytical standards produce high-fidelity certified reports trusted by national regulators, global partners, and independent auditors worldwide.",
  },
];

export default function WhatWeProvideSection() {
  return (
    <section id="provide" className="relative border-t border-border overflow-hidden bg-background">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <LandingSectionHeader
          eyebrow="Capabilities"
          title="Everything Your Institution Needs. Nothing It Does Not."
          subtitle="From sample intake to final certified report, GeoChem Suite covers the complete analytical workflow with institutional-grade controls at every stage."
        />
        {/* Service cards grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROVIDE_CARDS.map((card, idx) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover="hover"
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: idx * 0.06, duration: 0.45 }}
              className="landing-3d-card group rounded-2xl border border-accent/20 dark:border-accent/10 bg-gradient-to-br from-white/40 to-accent/[0.03] dark:from-neutral-900/40 dark:to-accent/[0.01] backdrop-blur-md p-6 shadow-lg shadow-black/[0.02] dark:shadow-black/30 shadow-[inset_0_1px_1px_rgba(245,184,0,0.35)] dark:shadow-[inset_0_1px_1px_rgba(245,184,0,0.15)] hover:shadow-2xl hover:shadow-accent/[0.06] dark:hover:shadow-accent/[0.12] hover:border-accent/40 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="grid size-14 place-items-center rounded-xl bg-primary/5 group-hover:bg-primary/15 transition-colors duration-300"
                  style={{ perspective: 1000 }}
                >
                  <motion.img
                    src={card.imgSrc}
                    alt={card.title}
                    className="size-10 object-contain drop-shadow-md brightness-0 dark:invert opacity-85 group-hover:opacity-100 transition-all duration-300"
                    variants={{
                      hover: {
                        rotateY: 180,
                        scale: 1.25,
                        y: -5,
                        transition: { type: "spring", stiffness: 180, damping: 12 },
                      },
                    }}
                  />
                </div>
              </div>
              <h3 className="mt-4 font-bold text-foreground font-display group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Get Started <ArrowRight className="size-3" />
              </span>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
