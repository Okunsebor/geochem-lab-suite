import { motion } from "framer-motion";
import { CheckCircle2, Cpu } from "lucide-react";

export default function PlatformSection() {
  return (
    <section id="platform" className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-2 items-center">
        <div className="space-y-6 text-left">

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Built for the realities of an assay lab
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Ditch manual logs and legacy Excel formulas. GeoChem Suite equips modern assay facilities with high-performance grids and contextual tracking shortcuts that keep technicians focused.
          </p>
          <div className="space-y-4">
            {[
              { title: "Benchling-Style UX density", desc: "Scientific metadata grids and timeline status transitions." },
              { title: "Physical scan workflows", desc: "Contextual scanner trigger dialogs pre-filled on hover." },
              { title: "QA/QC anomaly monitors", desc: "Real-time CRM tolerance mapping and validation rules." }
            ].map((item2, idx) => (
              <motion.div key={item2.title}
                initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="flex gap-3">
                <CheckCircle2 className="size-4.5 text-success shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">{item2.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{item2.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-xl border border-border bg-card p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-4 border-b border-border/60 pb-3">
            <span className="inline-flex items-center gap-1.5 font-mono"><Cpu className="size-3.5 text-primary" /> SECURE_LIMS_PIPELINE</span>
            <span className="text-[10px] text-success animate-pulse font-mono font-bold">READY</span>
          </div>
          <div className="space-y-2">
            {[
              ["GCS-24012", "In Analysis", "ICP-MS-01", "82%", "border-primary/20 bg-primary/5"],
              ["GCS-24008", "Preparation", "Pulverizer 2", "44%", "border-border hover:border-primary/20"],
              ["GCS-24004", "QA Flagged", "Au duplicate spread", "—", "border-destructive/30 bg-destructive/5 text-destructive"],
              ["GCS-24001", "Report Ready", "RPT-2041", "100%", "border-success/30 bg-success/5 text-success"],
            ].map(([id, st, who, pct, sc]) => (
              <div key={id}
                className={`grid grid-cols-12 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold font-mono transition-all duration-300 hover:pl-4 cursor-default ${sc}`}>
                <span className="col-span-3 text-foreground">{id}</span>
                <span className="col-span-3 opacity-90">{st}</span>
                <span className="col-span-4 truncate opacity-75">{who}</span>
                <span className="col-span-2 text-right opacity-90">{pct}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
