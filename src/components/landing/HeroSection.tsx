import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { BRAND_ASSETS } from "@/lib/branding";
import { UniPodLogo } from "@/components/branding/UniPodLogo";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 88, damping: 14 } },
} as const;

const TRUST_POINTS = [
  { val: "UniPod Nsuk", label: "Geochemistry laboratory" },
  { val: "Secure intake", label: "Chain of custody" },
  { val: "Registered access", label: "Customer portal" },
];

export default function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border/20 bg-background min-h-[calc(100vh-64px)] lg:min-h-[calc(85vh-64px)] flex items-center">
      <div className="absolute inset-0 gradient-mesh opacity-40 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 20%, rgba(0,174,239,0.14) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(245,184,0,0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 md:py-16 lg:py-20 w-full grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <motion.div
          className="lg:col-span-5 flex flex-col space-y-7"
          variants={container}
          initial="hidden"
          animate="show"
        >

          <motion.h1
            variants={item}
            className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl text-foreground leading-[1.06] font-display max-w-xl"
          >
            Welcome to the{" "}
            <span className="text-gradient font-black">UniPod Geochemistry Laboratory</span>
          </motion.h1>

          <motion.p variants={item} className="text-lg sm:text-xl leading-relaxed max-w-xl text-muted-foreground">
            Register to submit samples, track analytical progress, and receive certified geochemical
            reports through your secure customer portal.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:shadow-primary/45 transition-all hover:-translate-y-0.5 font-display"
            >
              Register for access <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/login"
              search={{}}
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary/30 bg-card/60 backdrop-blur-md px-8 py-4 text-sm font-semibold text-foreground hover:bg-primary/5 transition-all"
            >
              Already registered? Sign in
            </Link>
          </motion.div>

          <motion.div
            variants={item}
            className="inline-flex items-start gap-2 rounded-lg border border-border/80 bg-muted/30 px-4 py-3 text-xs text-muted-foreground max-w-md"
          >
            <Lock className="size-4 text-primary shrink-0 mt-0.5" />
            <span>
              The customer portal is available only after registration. Laboratory operations and
              coordinator tools require authorized staff credentials.
            </span>
          </motion.div>

          <motion.div
            variants={item}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-t border-border/40 pt-8"
          >
            {TRUST_POINTS.map((s) => (
              <div
                key={s.label}
                className="text-[10px] font-bold font-mono uppercase tracking-widest text-muted-foreground"
              >
                <span className="text-base sm:text-lg font-black text-foreground block font-display normal-case tracking-tight mb-1">
                  {s.val}
                </span>
                {s.label}
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="lg:col-span-7"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-2xl shadow-primary/10 ring-1 ring-primary/10">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/80 via-transparent to-transparent z-10 pointer-events-none" />
            <img
              src={BRAND_ASSETS.entrance}
              alt="UniPod Nsuk laboratory entrance"
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-8">
              <p className="text-white/90 text-sm font-medium max-w-md drop-shadow-md">
                UniPod Innovation Hub · Nasarawa State University — your gateway to precision
                geochemical analysis.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
