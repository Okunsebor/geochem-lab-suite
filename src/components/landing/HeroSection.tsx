import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Server, Shield } from "lucide-react";

const TYPEWRITER_PHRASES = [
  "Geochemical Analysis",
  "Mineral Intelligence",
  "Certified Reporting",
  "Institutional Research",
  "Scientific Discovery",
];

export default function HeroSection() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const cursorTimer = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(cursorTimer);
  }, []);

  useEffect(() => {
    const phrase = TYPEWRITER_PHRASES[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed.length < phrase.length) {
      const delay = 600 / phrase.length;
      timeout = setTimeout(() => {
        setDisplayed(phrase.slice(0, displayed.length + 1));
      }, delay);
    } else if (!isDeleting && displayed.length === phrase.length) {
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 1500);
    } else if (isDeleting && displayed.length > 0) {
      const delay = 400 / phrase.length;
      timeout = setTimeout(() => {
        setDisplayed(displayed.slice(0, -1));
      }, delay);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setPhraseIdx((idx) => (idx + 1) % TYPEWRITER_PHRASES.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, phraseIdx]);
  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center justify-start py-20 px-4 md:px-12 lg:px-24 select-none">
      {/* BACKGROUND LAYER: Full visibility image */}
      <div
        className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url('/branding/unipod-full-image.png')` }}
      />

      {/* OVERLAY: Pure black gradient to make white text readable, matching reference */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/95 via-black/75 to-black/20 pointer-events-none" />
      <div className="absolute inset-0 landing-grid-fine opacity-30 z-0 pointer-events-none" />

      {/* LAYER 3: Static content, left-aligned to match reference */}
      <motion.div
        className="relative z-20 max-w-4xl w-full text-left space-y-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Security badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-xs font-mono text-white tracking-wider shadow-sm"
        >
          <Lock className="size-3.5 text-[#00AEEF]" />
          <span>CONTROLLED ACCESS</span>
          <span className="h-3 w-px bg-white/20" />
          <span className="text-white/80">SECURE SYSTEM</span>
        </motion.div>

        {/* Hero headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="space-y-6"
        >
          <h1 className="text-5xl md:text-7xl xl:text-8xl font-extrabold tracking-tight text-white leading-[1.05] font-display">
            The Future of
            <span className="block mt-2 text-[#00AEEF] min-h-[1.15em]">
              {displayed}
              <span
                className="inline-block w-[3px] md:w-[6px] h-[0.8em] bg-[#00AEEF] ml-2 align-middle"
                style={{ opacity: cursorVisible ? 1 : 0, transition: "opacity 0.05s" }}
              />
            </span>
            <span className="block mt-2">Starts Here.</span>
          </h1>

          <div className="h-px w-24 bg-gradient-to-r from-[#00AEEF] to-transparent" />

          {/* Subtext */}
          <div className="max-w-2xl">
            <p className="text-base md:text-lg font-medium text-white/80 leading-relaxed">
              GeoChem Suite is West Africa's most advanced laboratory management platform,
              purpose-built for researchers, institutions, and enterprises that demand
              accurate, traceable, and certified analytical results.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-start gap-4 pt-4">
            <Link
              to="/register"
              className="btn-theme-cyan inline-flex items-center justify-center gap-2 min-w-[200px] text-base py-3.5 !rounded-xl shadow-md border-none"
            >
              Get Started <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.div>

        {/* Footer credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-wrap items-center justify-start gap-6 text-xs text-white/60 font-mono tracking-wider pt-4"
        >
          <span className="flex items-center gap-1.5">
            <Server className="size-3.5 text-[#00AEEF]" />
            POWERED BY UNIPOD
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <Shield className="size-3.5 text-[#22C55E]" />
            ENCRYPTED SESSION
          </span>
          <span className="hidden sm:inline">·</span>
          <span>ESTABLISHED 2026</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
