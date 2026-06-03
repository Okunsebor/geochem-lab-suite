import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LandingSectionHeader } from "./shared/LandingSectionHeader";

const PROVIDE_CARDS = [
  {
    imgSrc: "/capabilities/institutional-trust.png",
    title: "Institutional Trust & Governance",
    description: "Operating under strict ISO-compliant frameworks with complete role-based clearance protocols.",
  },
  {
    imgSrc: "/capabilities/research-infrastructure.png",
    title: "Advanced Research Infrastructure",
    description: "State-of-the-art analytical apparatus housed in Nasarawa State University's UniPod Innovation Hub.",
  },
  {
    imgSrc: "/capabilities/confidential.png",
    title: "Confidential Analytical Intelligence",
    description: "Restricted data pathways designed to protect proprietary institutional and mineralogical findings.",
  },
  {
    imgSrc: "/capabilities/data-security.png",
    title: "Sovereign Data Security",
    description: "Immutable ledger tracking and secure verification controls ensuring absolute cryptographic data integrity.",
  },
  {
    imgSrc: "/capabilities/industrial-collab.png",
    title: "Academic & Industrial Collaboration",
    description: "Accelerating the R&D ecosystem through active co-creation with international development partners.",
  },
  {
    imgSrc: "/capabilities/precision.png",
    title: "Precision-Engineered Outcomes",
    description: "Rigorous standards delivering high-fidelity certified reports for national and global decision-makers.",
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
              whileHover="hover"
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: idx * 0.06, duration: 0.45 }}
              className="landing-3d-card group rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-14 place-items-center rounded-xl bg-primary/5 group-hover:bg-primary/15 transition-colors duration-300" style={{ perspective: 1000 }}>
                  <motion.img 
                    src={card.imgSrc} 
                    alt={card.title}
                    className="size-9 object-contain drop-shadow-md brightness-0 invert opacity-80 group-hover:opacity-100 group-hover:brightness-100 group-hover:invert-0 transition-all duration-300"
                    variants={{
                      hover: {
                        rotateX: 20,
                        rotateY: -20,
                        scale: 1.25,
                        y: -5,
                        transition: { type: "spring", stiffness: 300, damping: 15 }
                      }
                    }}
                  />
                </div>
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
