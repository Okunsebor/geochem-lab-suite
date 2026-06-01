import { motion } from "framer-motion";
import {
  ScanBarcode, Beaker, ShieldCheck, Users, ClipboardList, BarChart3, ArrowRight,
} from "lucide-react";
import { LandingSectionHeader } from "./shared/LandingSectionHeader";


const PROVIDE_CARDS = [
  {
    icon: ScanBarcode,
    title: "Laboratory Information Management",
    description: "Automate workflows, integrate instruments, and manage specimens with full traceability from reception to release.",
    tag: "Core LIMS",
  },
  {
    icon: Beaker,
    title: "Analytical Operations",
    description: "Preparation boards, instrument queues, raw data capture, and QA/QC validation aligned with assay-lab realities.",
    tag: "Operations",
  },
  {
    icon: Users,
    title: "Customer Portal",
    description: "Registered clients submit batches, track custody in real time, and download branded certificates securely.",
    tag: "Portal",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Audit",
    description: "Role-based access, immutable logs, and ISO 17025-ready checkpoints built for accreditation-minded labs.",
    tag: "Governance",
  },
  {
    icon: ClipboardList,
    title: "Lab Coordinator Workspace",
    description: "Dedicated coordinator portal for intake verification, preparation dispatch, and escalation management.",
    tag: "Coordinator",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Turnaround metrics, QA performance dashboards, and professional PDF analytical reports.",
    tag: "Insights",
  },
];

export default function WhatWeProvideSection() {
  return (
    <section id="provide" className="relative border-t border-border overflow-hidden bg-background">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <LandingSectionHeader
          eyebrow="What we provide"
          title="Data-driven, specimen-centric laboratory services"
          subtitle="GeoChem Suite at UniPod Nsuk unifies LIMS operations, client access, and compliance in one premium platform."
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
                Read details <ArrowRight className="size-3" />
              </span>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
