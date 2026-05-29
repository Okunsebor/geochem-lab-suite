import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import TypewriterSubheading from "./TypewriterSubheading";
import Workspace3DShowcase from "./Workspace3DShowcase";

// ─── Animation variants ─────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.06 } }
} as any;
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 88, damping: 14 } }
} as any;

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/20 bg-background min-h-[calc(100vh-64px)] flex items-center">

      {/* Gradient mesh */}
      <div className="absolute inset-0 gradient-mesh opacity-40 pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-[0.07] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 w-full grid lg:grid-cols-12 gap-10 items-center">

        {/* LEFT column */}
        <motion.div className="lg:col-span-5 flex flex-col space-y-7" variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-bold font-mono tracking-widest text-primary uppercase backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              UniPod LIMS
            </span>
          </motion.div>

          <motion.h1 variants={item}
            className="text-3xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl text-foreground leading-[1.05] font-display">
            Track Every{" "}
            <span className="text-gradient font-black">Geological Sample</span>{" "}

          </motion.h1>

          <motion.p variants={item} className="text-base sm:text-lg leading-relaxed font-sans min-h-[3.5rem]">
            <TypewriterSubheading />
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap gap-3">
            <Link to="/app"
              className="inline-flex items-center gap-2 rounded-lg gradient-primary px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all hover:-translate-y-0.5 font-display">
              Launch Platform <ArrowRight className="size-4" />
            </Link>
            <Link to="/portal"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 backdrop-blur-md px-7 py-4 text-sm font-semibold hover:bg-muted text-foreground transition-all hover:-translate-y-0.5 font-display">
              Request Demo
            </Link>
          </motion.div>

          <motion.div variants={item}
            className="grid grid-cols-3 gap-5 border-t border-border/40 pt-6 text-[10px] font-bold font-mono uppercase tracking-widest text-muted-foreground">
            {[
              { val: "99.98%", label: "Uptime SLA" },
              { val: "< 1.5s", label: "Intake Latency" },
              { val: "Zero", label: "Manual Errors" },
            ].map(s => (
              <div key={s.label}>
                <span className="text-2xl sm:text-3xl font-black text-foreground block font-display">{s.val}</span>
                {s.label}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT column — 3D showcase */}
        <motion.div className="lg:col-span-7"
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <Workspace3DShowcase />
        </motion.div>
      </div>
    </section>
  );
}
