import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Cpu } from "lucide-react";

export default function PlatformSection() {
  return (
    <section id="platform" className="border-t border-border" aria-labelledby="platform-heading">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6 text-left">
            <h2
              id="platform-heading"
              className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display"
            >
              Built for the realities of an assay lab
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Replace manual logs and legacy spreadsheets. High-performance grids and contextual
              shortcuts keep technicians focused on specimens — not paperwork.
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "Scientific metadata density",
                  desc: "Grids and timeline transitions built for assay workflows.",
                },
                {
                  title: "Physical scan workflows",
                  desc: "Scanner dialogs pre-filled at intake and handoff points.",
                },
                {
                  title: "QA/QC anomaly monitors",
                  desc: "Real-time CRM tolerance mapping and validation rules.",
                },
              ].map((item2, idx) => (
                <motion.div
                  key={item2.title}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-3"
                >
                  <CheckCircle2 className="size-4.5 text-success shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{item2.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{item2.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div
              id="analytics"
              className="rounded-xl border border-border/80 bg-card/40 p-5 scroll-mt-24"
            >
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground font-display">
                  Analytics & reporting
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Operational dashboards, turnaround metrics, and QA/QC pass rates — exportable for
                management review and accreditation audits.
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 shadow-2xl shadow-primary/5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-4 border-b border-border/60 pb-3">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Cpu className="size-3.5 text-primary" /> SECURE_LIMS_PIPELINE
              </span>
              <span className="text-[10px] text-success animate-pulse font-mono font-bold">
                READY
              </span>
            </div>
            <div className="space-y-2">
              {[
                ["GCS-24012", "In Analysis", "ICP-MS-01", "82%", "border-primary/20 bg-primary/5"],
                [
                  "GCS-24008",
                  "Preparation",
                  "Pulverizer 2",
                  "44%",
                  "border-border hover:border-primary/20",
                ],
                [
                  "GCS-24004",
                  "QA Flagged",
                  "Au duplicate spread",
                  "—",
                  "border-destructive/30 bg-destructive/5 text-destructive",
                ],
                [
                  "GCS-24001",
                  "Report Ready",
                  "RPT-2041",
                  "100%",
                  "border-success/30 bg-success/5 text-success",
                ],
              ].map(([id, st, who, pct, sc]) => (
                <div
                  key={id}
                  className={`grid grid-cols-12 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold font-mono transition-all duration-300 hover:pl-4 cursor-default ${sc}`}
                >
                  <span className="col-span-3 text-foreground">{id}</span>
                  <span className="col-span-3 opacity-90">{st}</span>
                  <span className="col-span-4 truncate opacity-75">{who}</span>
                  <span className="col-span-2 text-right opacity-90">{pct}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
