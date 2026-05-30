import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShieldCheck, Workflow, BarChart3, ScanBarcode, Beaker, Building2 } from "lucide-react";
import GeologicalWorkflowStorytelling from "../components/lims/GeologicalWorkflowStorytelling";
import unipodLab from "../assets/unipod-lab.jpg";
import unipodFacade from "../assets/unipod-facade.jpg";
import unipodEvent from "../assets/unipod-event.png";
import unipodLogo from "../assets/unipod-logo.png";

export const Route = createFileRoute("/")(({
  component: Landing,
  head: () => ({
    meta: [
      { title: "GeoChem Suite — Geochemical Intelligence for Scientific Excellence" },
      { name: "description", content: "GeoChem Suite powers sample tracking, laboratory operations, analysis workflows, and certified reporting for modern scientific institutions." },
    ],
  }),
}) as any);

// ─── Cinematic Hero ─────────────────────────────────────────────────────────
function CinematicHero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 200]);
  const scale = useTransform(scrollY, [0, 800], [1.05, 1.15]);
  const overlayOpacity = useTransform(scrollY, [0, 600], [0.55, 0.85]);
  const contentY = useTransform(scrollY, [0, 600], [0, -60]);
  const contentOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 12;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section className="relative h-screen min-h-[720px] w-full overflow-hidden bg-[#031426]">
      {/* Parallax image layer */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y, scale, x: mouse.x, translateY: mouse.y }}
      >
        <img
          src={unipodFacade}
          alt="UniPod facility — Nasarawa State University, Keffi"
          className="h-full w-full object-cover"
          style={{
            filter: "contrast(1.08) saturate(1.12) brightness(1.05)",
          }}
        />
      </motion.div>

      {/* Blue cinematic gradient overlays — keep image bright & visible */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: overlayOpacity }}
      >
        <div className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(3,20,38,0.55) 0%, rgba(3,20,38,0.15) 30%, rgba(3,20,38,0.10) 55%, rgba(3,20,38,0.78) 100%)",
          }} />
        <div className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(0,46,92,0.78) 0%, rgba(0,82,150,0.30) 38%, rgba(0,110,181,0.05) 60%, transparent 80%)",
          }} />
        <div className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 22% 50%, rgba(0,110,181,0.35) 0%, transparent 55%)",
          }} />
      </motion.div>

      {/* Subtle grain / scanline texture for cinematic feel */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 1px, transparent 1px, transparent 3px)",
        }} />

      {/* Top nav */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 right-0 z-30"
      >
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="rounded-md bg-white/95 backdrop-blur px-2.5 py-1.5 shadow-lg ring-1 ring-white/40">
              <img src={unipodLogo} alt="UniPod · Nasarawa State University · UNDP" className="h-7 w-auto object-contain" />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-white font-display font-bold tracking-tight text-sm">GeoChem Suite</div>
              <div className="text-white/60 font-mono text-[9px] uppercase tracking-[0.2em]">UniPod · MineTech</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[13px] text-white/75 font-medium">
            <a href="#facility" className="hover:text-white transition-colors">Facility</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#access" className="hover:text-white transition-colors">Access</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex items-center rounded-md px-3.5 py-2 text-[13px] font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors backdrop-blur">
              Sign in
            </Link>
            <Link to="/app" className="inline-flex items-center gap-1.5 rounded-md bg-white text-[#04284a] px-3.5 py-2 text-[13px] font-semibold shadow-lg hover:bg-white/95 transition-all hover:-translate-y-px">
              Launch <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero content */}
      <motion.div
        className="relative z-20 h-full flex items-center"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="mx-auto max-w-7xl px-6 w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-2 mb-7"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold font-mono tracking-[0.18em] text-white uppercase">
                <span className="size-1.5 rounded-full bg-[#4FB4F0] animate-pulse" />
                Powered by UniPod
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold font-mono tracking-[0.18em] text-white uppercase">
                UNDP Innovation Ecosystem
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4A017]/50 bg-[#D4A017]/15 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold font-mono tracking-[0.18em] text-[#F4D77A] uppercase">
                Enterprise Laboratory Infrastructure
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-extrabold tracking-tight text-white text-[2.5rem] sm:text-6xl xl:text-7xl leading-[1.02]"
              style={{ textShadow: "0 4px 32px rgba(0,0,0,0.45)" }}
            >
              Geochemical Intelligence.
              <br />
              <span className="bg-gradient-to-r from-white via-[#A8D8F5] to-[#4FB4F0] bg-clip-text text-transparent">
                Built for Scientific Excellence.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 max-w-2xl text-base sm:text-lg text-white/85 leading-relaxed font-sans"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}
            >
              GeoChem Suite powers sample tracking, laboratory operations, analysis workflows, and certified reporting for modern scientific institutions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.78, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-lg bg-white text-[#04284a] px-7 py-4 text-sm font-bold shadow-2xl shadow-[#006EB5]/30 hover:shadow-[#006EB5]/50 transition-all hover:-translate-y-0.5 font-display"
              >
                Request Access
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#facility"
                className="inline-flex items-center gap-2 rounded-lg border border-white/35 bg-white/10 backdrop-blur-md px-7 py-4 text-sm font-bold text-white hover:bg-white/20 hover:border-white/60 transition-all hover:-translate-y-0.5 font-display"
              >
                Explore the Laboratory
              </a>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Bottom institutional bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.9 }}
        className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/15 bg-gradient-to-t from-[#031426]/95 to-transparent backdrop-blur-sm"
      >
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-white/55">
            An institutional collaboration
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] font-display font-semibold text-white/80">
            <span>Nasarawa State University</span>
            <span className="text-white/25">·</span>
            <span>UniPod MineTech</span>
            <span className="text-white/25">·</span>
            <span>UNDP</span>
            <span className="text-white/25">·</span>
            <span>Ministry of Solid Minerals</span>
          </div>
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-1.5"
      >
        <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/50">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-[1px] bg-gradient-to-b from-white/60 to-transparent"
        />
      </motion.div>
    </section>
  );
}

// ─── Landing Page ───────────────────────────────────────────────────────────
function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <CinematicHero />

      {/* ── UNIPOD FACILITY SHOWCASE ───────────────────────────── */}
      <section id="facility" className="relative border-b border-border bg-gradient-to-b from-white to-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[10px] font-bold font-mono tracking-widest text-primary uppercase">
                Inside the Facility
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display leading-[1.1]">
                A national-scale geochemistry lab, digitized end-to-end.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                GeoChem Suite is the operating system of the MineTech UniPod at
                Nasarawa State University, Keffi — purpose-built to run the
                analytical instrumentation, chain-of-custody, and reporting
                pipelines of a UNDP-supported innovation center for Nigeria&apos;s
                mining ecosystem.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { k: "ICP-MS · ICP-OES", v: "Trace element assay" },
                  { k: "XRF · AAS · LECO", v: "Multi-element & combustion" },
                  { k: "Sample Prep Suite", v: "Drying · Crushing · Pulverizing" },
                  { k: "QA / QC Engine", v: "CRM control & duplicate spread" },
                ].map(c => (
                  <div key={c.k} className="rounded-lg border border-border bg-white p-3">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">{c.k}</div>
                    <div className="text-sm font-semibold text-foreground mt-1">{c.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-6 grid-rows-6 gap-4 h-[560px]">
              <motion.div
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7 }}
                className="col-span-4 row-span-4 relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-primary/10 group">
                <img src={unipodFacade} alt="UniPod facade — architectural entrance with UNDP signage"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#041C32]/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-80">MineTech UniPod</div>
                  <div className="text-xl font-bold font-display">Nasarawa State University · Keffi</div>
                </div>
                <div className="absolute top-4 right-4 rounded-md bg-white/95 px-2.5 py-1 text-[9px] font-mono font-bold text-primary tracking-widest">UNDP · NSU</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
                className="col-span-2 row-span-3 relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-primary/10 group">
                <img src={unipodLab} alt="UniPod laboratory bench — ICP and XRF instrumentation"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#041C32]/55 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-[9px] font-mono tracking-widest opacity-80">UNIT 04</div>
                  <div className="text-sm font-bold font-display">Instrumentation Hall</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
                className="col-span-2 row-span-3 relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-primary/10 group bg-white">
                <img src={unipodEvent} alt="Ideation Workshop / Ecosystem Mixer 2026 — UniPod"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
                className="col-span-4 row-span-2 rounded-2xl bg-gradient-to-br from-[#041C32] to-[#0B2B4A] text-white p-5 grid grid-cols-3 gap-4 shadow-xl ring-1 ring-primary/20">
                {[
                  { v: "12+", l: "Analytical Instruments" },
                  { v: "4", l: "Prep Workflow Stages" },
                  { v: "100%", l: "Digital Custody" },
                ].map(s => (
                  <div key={s.l} className="flex flex-col justify-center">
                    <div className="text-2xl sm:text-3xl font-black font-display text-accent">{s.v}</div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/70 mt-1">{s.l}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <div id="workflow">
        <GeologicalWorkflowStorytelling />
      </div>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section id="access" className="border-t border-border bg-gradient-to-b from-background to-card/25">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display">
            Ready to digitize your lab operations?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join the institutions running modern scientific operations on GeoChem Suite — from sample intake to certified reporting.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
              Request Access <ArrowRight className="size-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted text-foreground transition-all hover:-translate-y-0.5">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-xs sm:text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={unipodLogo} alt="UniPod" className="h-7 w-auto object-contain" />
            <span className="font-semibold text-foreground">© 2026 GeoChem Suite · UniPod · UNDP Innovation Ecosystem</span>
          </div>
          <div className="flex gap-6 font-semibold">
            <a href="#facility" className="hover:text-primary transition-colors">Facility</a>
            <a href="#workflow" className="hover:text-primary transition-colors">Workflow</a>
            <a href="#access" className="hover:text-primary transition-colors">Access</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
