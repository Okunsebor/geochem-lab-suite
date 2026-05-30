import { motion } from "framer-motion";
import { ShieldCheck, FileCheck, Lock, Award } from "lucide-react";

const COMPLIANCE_CHIPS = [
  { icon: ShieldCheck, label: "UniPod brand standards" },
  { icon: FileCheck, label: "Chain of custody" },
  { icon: Lock, label: "Registered portal access" },
  { icon: Award, label: "ISO 17025-ready workflows" },
];

export default function TrustBarSection() {
  return (
    <section className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-12 lg:py-16">
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {COMPLIANCE_CHIPS.map((chip, idx) => (
            <motion.div
              key={chip.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-foreground"
            >
              <chip.icon className="size-3.5 text-primary shrink-0" />
              {chip.label}
            </motion.div>
          ))}
        </div>
        <p className="text-center text-[10px] font-bold font-mono uppercase tracking-widest text-muted-foreground">
          UniPod Innovation Hub · Nasarawa State University, Nsuk
        </p>
      </div>
    </section>
  );
}
