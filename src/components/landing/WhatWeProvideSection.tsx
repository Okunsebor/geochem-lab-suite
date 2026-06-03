import { motion } from "framer-motion";
import {
  ShieldCheck, Beaker, Lock, Database, Globe, Target, ArrowRight,
} from "lucide-react";
import { LandingSectionHeader } from "./shared/LandingSectionHeader";


const PROVIDE_CARDS = [
  {
    icon: ShieldCheck,
    title: "Institutional Trust & Governance",
    description: "Operating under strict ISO-compliant frameworks with complete role-based clearance protocols.",
    tag: "Governance",
  },
  {
    icon: Beaker,
    title: "Advanced Research Infrastructure",
    description: "State-of-the-art analytical apparatus housed in Nasarawa State University's UniPod Innovation Hub.",
    tag: "Infrastructure",
  },
  {
    icon: Lock,
    title: "Confidential Analytical Intelligence",
    description: "Restricted data pathways designed to protect proprietary institutional and mineralogical findings.",
    tag: "Exclusivity",
  },
  {
    icon: Database,
    title: "Sovereign Data Security",
    description: "Immutable ledger tracking and secure verification controls ensuring absolute cryptographic data integrity.",
    tag: "Security",
  },
  {
    icon: Globe,
    title: "Academic & Industrial Collaboration",
    description: "Accelerating the R&D ecosystem through active co-creation with international development partners.",
    tag: "Synergy",
  },
  {
    icon: Target,
    title: "Precision-Engineered Outcomes",
    description: "Rigorous standards delivering high-fidelity certified reports for national and global decision-makers.",
    tag: "Precision",
  },
];

export default function WhatWeProvideSection() {
  return (
    <section id="provide" className="relative border-t border-border overflow-hidden bg-background">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <LandingSectionHeader
          eyebrow="Capabilities"
          title="World-Class Geochemistry Infrastructure"
          subtitle="GeoChem Suite at UniPod Nsuk operates under strict institutional controls, serving top-tier agencies and enterprise research partners."
        />
        {/* Service cards grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROVIDE_CARDS.map((card, idx) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: idx * 0.06, duration: 0.45 }}
              whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}
              className="landing-3d-card group rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-6 hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <card.icon className="size-5" />
                </div>
                <span className="text-[9px] font-bold font-mono uppercase tracking-widest text-accent px-2 py-1 rounded-full bg-accent/10">
                  {card.tag}
                </span>
              </div>
              <h3 className="mt-4 font-bold text-foreground font-display group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Request Access <ArrowRight className="size-3" />
              </span>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
