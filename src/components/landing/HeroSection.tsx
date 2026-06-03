import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Server, Shield } from "lucide-react";
import PartnershipModal from "./shared/PartnershipModal";

export default function HeroSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center justify-center py-20 px-4 md:px-8 select-none">
      {/* BACKGROUND LAYER: The new subtle image */}
      <div 
        className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-center opacity-[0.07] grayscale pointer-events-none"
        style={{ backgroundImage: `url('/branding/hero-bg-subtle.png')` }}
      />

      {/* OVERLAY: Soft ambient background gradient to maintain text contrast */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#F7F9FC]/80 via-[#F7F9FC]/95 to-[#F7F9FC] pointer-events-none" />
      <div className="absolute inset-0 landing-grid-fine opacity-50 z-0 pointer-events-none" />

      {/* LAYER 3: Static content */}
      <motion.div
        className="relative z-20 max-w-4xl mx-auto w-full text-center space-y-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Security badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E2E8F0] bg-[#FFFFFF]/80 backdrop-blur-md text-xs font-mono text-[#2563EB] tracking-wider shadow-sm"
        >
          <Lock className="size-3.5 text-[#2563EB]" />
          <span>CONTROLLED ACCESS</span>
          <span className="h-3 w-px bg-[#E2E8F0]" />
          <span className="text-[#475569]">SECURE SYSTEM</span>
        </motion.div>

        {/* Hero headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="space-y-6"
        >
          <h1 className="text-5xl md:text-7xl xl:text-8xl font-extrabold tracking-tight text-[#0F172A] leading-[1.05] font-display">
            Scientific Infrastructure.
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#0EA5E9]">
              Reimagined.
            </span>
          </h1>

          <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#CBD5E1] to-transparent mx-auto" />

          {/* Subtext */}
          <div className="space-y-2 max-w-2xl mx-auto">
            <p className="text-xl md:text-2xl font-bold text-[#0F172A]">
              Trusted Analytical Intelligence.
            </p>
            <p className="text-base md:text-lg font-semibold text-[#475569]">
              Built for Institutions. Designed for Precision.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="btn-theme-cyan inline-flex items-center justify-center gap-2 min-w-[200px] text-base py-3.5 !rounded-xl shadow-md"
            >
              Get Started <ArrowRight className="size-4" />
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-theme-outline inline-flex items-center justify-center gap-2 min-w-[200px] text-base py-3.5 !rounded-xl bg-white shadow-sm"
            >
              Institutional Partnership
            </button>
          </div>
        </motion.div>

        {/* Footer credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#475569]/70 font-mono tracking-wider pt-2"
        >
          <span className="flex items-center gap-1.5">
            <Server className="size-3.5 text-[#2563EB]" />
            POWERED BY UNIPOD
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <Shield className="size-3.5 text-[#0EA5E9]" />
            ENCRYPTED SESSION
          </span>
          <span className="hidden sm:inline">·</span>
          <span>ESTABLISHED 2026</span>
        </motion.div>
      </motion.div>

      {/* Secure Partnership Modal */}
      <PartnershipModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
