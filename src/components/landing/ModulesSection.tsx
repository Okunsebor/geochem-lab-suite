import { motion } from "framer-motion";
import {
  ScanBarcode, Workflow, Beaker, ShieldCheck, BarChart3, Building2
} from "lucide-react";

export default function ModulesSection() {
  return (
    <section id="modules" className="border-t border-border bg-card/25">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-3xl text-center mx-auto">
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display">
            A complete laboratory workflow, end-to-end
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Every stage of geochemical analysis instrumented — with physical barcodes, precise custody check-ins, automated duplicates spreads, and ISO calibration registries.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { i: ScanBarcode, t: "Sample Intake", d: "Thermal label generation, scannable QR/Code-39 custody records, physical shelf mapping." },
            { i: Workflow, t: "Preparation", d: "Dynamic stages tracking for moisture extraction, pulverization, splitting, and core sawing." },
            { i: Beaker, t: "Analysis", d: "Real-time instrument queues for ICP-MS/OES, automated raw assay data hydration." },
            { i: ShieldCheck, t: "QA / QC Engine", d: "Duplicate spreads alerts, certified CRM controls mapping, and analytical flag isolates." },
            { i: BarChart3, t: "Reporting", d: "Branded PDF analytical certificates dispatch, double-verification protocols, email approvals." },
            { i: Building2, t: "Customer Portal", d: "Instant self-service custody trackers, secure download vault, and technical support desk." },
          ].map((m, idx) => (
            <motion.div key={m.t}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: idx * 0.05, type: "spring", stiffness: 90, damping: 13 }}
              className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:bg-muted/10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
              <div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <m.i className="size-5 transition-transform group-hover:scale-110" />
              </div>
              <h3 className="mt-4 font-bold text-foreground text-base group-hover:text-primary transition-colors">{m.t}</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{m.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
