import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { Lock, ArrowRight, Server, Shield } from "lucide-react";
import { BRAND_ASSETS } from "@/lib/branding";
import PartnershipModal from "./shared/PartnershipModal";

export default function HeroSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Mouse / Touch positions relative to the hero section container
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for high-performance 60fps tracking — tighter for 3D feel
  const spotlightX = useSpring(mouseX, { damping: 28, stiffness: 280, mass: 0.5 });
  const spotlightY = useSpring(mouseY, { damping: 28, stiffness: 280, mass: 0.5 });

  // Separate spring for opacity fade in/out
  const opacityTarget = useMotionValue(0);
  const spotlightOpacity = useSpring(opacityTarget, { damping: 22, stiffness: 130 });

  // 3D parallax tilt values derived from mouse position
  const tiltX = useSpring(useTransform(mouseY, [0, 800], [6, -6]), { damping: 30, stiffness: 200 });
  const tiltY = useSpring(useTransform(mouseX, [0, 1400], [-6, 6]), { damping: 30, stiffness: 200 });

  useEffect(() => {
    opacityTarget.set(isHovered ? 1 : 0);
  }, [isHovered, opacityTarget]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.touches[0].clientX - rect.left);
      mouseY.set(e.touches[0].clientY - rect.top);
    }
  };

  // Large spotlight mask — 520px radius for an immersive 3D feel
  const maskImage = useTransform(
    [spotlightX, spotlightY, spotlightOpacity],
    ([x, y, op]: any[]) =>
      `radial-gradient(circle 520px at ${x}px ${y}px, rgba(0,0,0,${op}) 0%, rgba(0,0,0,${(op as number) * 0.55}) 40%, rgba(0,0,0,${(op as number) * 0.12}) 70%, rgba(0,0,0,0) 100%)`
  );

  // Outer ambient glow ring follows cursor
  const glowOpacity = useTransform(spotlightOpacity, (op: number) => op * 0.22);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#F7F9FC] min-h-[calc(100vh-64px)] flex items-center justify-center py-20 px-4 md:px-8 cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* LAYER 0: Fine grid base */}
      <div className="absolute inset-0 landing-grid-fine opacity-50 z-0 pointer-events-none" />

      {/* LAYER 0b: Soft ambient gradient */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 15% 25%, rgba(37, 99, 235, 0.06) 0%, transparent 55%), radial-gradient(circle at 85% 75%, rgba(14, 165, 233, 0.04) 0%, transparent 55%)",
        }}
      />

      {/* LAYER 1: UniPod facility image — always covers the full hero, revealed by cursor spotlight mask */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none select-none bg-no-repeat bg-cover bg-center"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
          backgroundImage: `url(${BRAND_ASSETS.labInterior})`,
        }}
      />

      {/* LAYER 2: Cinematic 3D glow ring — tracks cursor with a large soft bloom */}
      <motion.div
        className="absolute pointer-events-none rounded-full blur-3xl z-[11]"
        style={{
          left: spotlightX,
          top: spotlightY,
          opacity: glowOpacity,
          x: "-50%",
          y: "-50%",
          width: 700,
          height: 700,
          background:
            "radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, rgba(14, 165, 233, 0.14) 45%, transparent 75%)",
        }}
      />

      {/* LAYER 3: 3D parallax content — tilts with mouse to give depth */}
      <motion.div
        className="relative z-20 max-w-4xl mx-auto w-full text-center space-y-8"
        style={{
          rotateX: tiltX,
          rotateY: tiltY,
          transformPerspective: 1200,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Security badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E2E8F0] bg-[#F1F5F9]/80 backdrop-blur-md text-xs font-mono text-[#2563EB] tracking-wider"
        >
          <Lock className="size-3.5 text-[#2563EB] animate-pulse" />
          <span>CONTROLLED ACCESS</span>
          <span className="h-3 w-px bg-[#E2E8F0]" />
          <span className="text-[#475569]">SECURE SYSTEM</span>
        </motion.div>

        {/* Hero headline — bare text, no white card */}
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
              Request Access <ArrowRight className="size-4" />
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-theme-outline inline-flex items-center justify-center gap-2 min-w-[200px] text-base py-3.5 !rounded-xl"
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
