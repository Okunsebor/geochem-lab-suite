import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { BRAND_ASSETS } from "@/lib/branding";
import { OptimizedImage } from "@/components/shared/OptimizedImage";
import { AnimatedWorkflowText } from "./AnimatedWorkflowText";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 16 } },
};

export default function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border/20 bg-background min-h-[calc(100vh-64px)] lg:min-h-[calc(85vh-64px)] flex items-center">
      {/* Enterprise background grids and meshes */}
      <div className="absolute inset-0 landing-grid-fine opacity-60 pointer-events-none" />
      <div className="absolute inset-0 gradient-mesh opacity-40 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 15% 30%, rgba(0, 110, 181, 0.08) 0%, transparent 60%), radial-gradient(circle at 85% 60%, rgba(212, 160, 23, 0.05) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 md:py-16 lg:py-20 w-full grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <motion.div
          className="lg:col-span-6 flex flex-col space-y-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm w-fit">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Enterprise Platform</span>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-5xl font-extrabold tracking-tight sm:text-6xl xl:text-[4.5rem] text-foreground leading-[1.08] font-display"
          >
            <span className="block text-2xl sm:text-3xl font-semibold text-muted-foreground mb-4 uppercase tracking-[0.2em]">
              Geochemical Intelligence
            </span>
            <span className="block mb-1">Built for</span>
            <span className="block">
              <AnimatedWorkflowText />
            </span>
          </motion.h1>

          <motion.p variants={item} className="text-lg sm:text-xl leading-relaxed max-w-xl text-muted-foreground">
            A secure, ISO-compliant laboratory information management system designed for precision tracking from intake to analytical reporting.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4">
            <Link
              to="/register"
              className="btn-theme-cyan inline-flex items-center justify-center gap-2"
            >
              Request Access <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/login"
              search={{}}
              className="btn-theme-outline inline-flex items-center justify-center gap-2"
            >
              Sign In to Portal
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="lg:col-span-6 relative"
          initial={reduceMotion ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.9, type: "spring", stiffness: 50, damping: 20 }}
        >
          {/* Polished enterprise visual */}
          <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/5 bg-card/40 backdrop-blur-3xl ring-1 ring-white/10 p-2">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent z-0 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 rounded-xl overflow-hidden border border-border/40 shadow-inner">
               <OptimizedImage
                src={BRAND_ASSETS.entrance}
                alt="Laboratory Intelligence Workflow"
                className="w-full aspect-[4/3] object-cover scale-105 hover:scale-100 transition-transform duration-1000 ease-out"
                width={1200}
                height={900}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#041C32]/90 via-[#041C32]/20 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-8 flex items-end justify-between">
                <div>
                  <p className="text-white/90 text-sm font-medium drop-shadow-md flex items-center gap-2">
                    <ShieldCheck className="size-5 text-primary" />
                    Trusted by Scientific Institutions
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative enterprise nodes */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/10 rounded-full blur-2xl z-0" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl z-0" />
        </motion.div>
      </div>
    </section>
  );
}
