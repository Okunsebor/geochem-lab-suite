import { motion } from "framer-motion";
import {
  ScanBarcode, Workflow, Beaker, ShieldCheck, BarChart3, Building2
} from "lucide-react";

const MODULES = [
  { i: ScanBarcode, t: "Sample Intake", d: "Thermal labels, QR custody records, and shelf mapping from day one." },
  { i: Workflow, t: "Preparation", d: "Moisture, pulverization, splitting, and core sawing — staged and traceable." },
  { i: Beaker, t: "Analysis", d: "ICP-MS/OES queues with automated raw assay hydration." },
  { i: ShieldCheck, t: "QA / QC Engine", d: "Duplicate spreads, CRM controls, and analytical flag isolation." },
  { i: BarChart3, t: "Reporting", d: "Branded PDF certificates with double-verification and dispatch." },
  { i: Building2, t: "Customer Portal", d: "Client self-service tracking, downloads, and support desk." },
];

export default function ModulesSection() {
  return (
    <section id="modules" className="border-t border-border bg-card/25" aria-labelledby="modules-heading">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl text-center mx-auto">
          <h2
            id="modules-heading"
            className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display"
          >
            A complete laboratory workflow, end-to-end
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Every stage of geochemical analysis instrumented — barcodes, custody, QA/QC, and
            certificates in one platform.
          </p>
          <a
            href="#workflow"
            className="inline-block mt-4 text-sm font-semibold text-primary hover:underline underline-offset-4"
          >
            See interactive workflow →
          </a>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, idx) => (
            <motion.div
              key={m.t}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: idx * 0.05, type: "spring", stiffness: 90, damping: 13 }}
              className="group rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 hover:border-primary/50 hover:bg-muted/10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
            >
              <div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <m.i className="size-5 transition-transform group-hover:scale-110" />
              </div>
              <h3 className="mt-4 font-bold text-foreground text-base group-hover:text-primary transition-colors">
                {m.t}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
