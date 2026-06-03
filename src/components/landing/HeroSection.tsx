import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ShieldCheck, Lock, ArrowRight, Server, Shield } from "lucide-react";
import { BRAND_ASSETS } from "@/lib/branding";
import PartnershipModal from "./shared/PartnershipModal";

export default function HeroSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse / Touch positions relative to the hero section container
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for high performance 60fps tracking
  const spotlightX = useSpring(mouseX, { damping: 35, stiffness: 220, mass: 0.6 });
  const spotlightY = useSpring(mouseY, { damping: 35, stiffness: 220, mass: 0.6 });
  const spotlightOpacity = useSpring(isHovered ? 1 : 0, { damping: 20, stiffness: 120 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.touches[0].clientX - rect.left);
      mouseY.set(e.touches[0].clientY - rect.top);
    }
  };

  // Build the radial gradient mask dynamically as a motion transform
  const maskImage = useTransform(
    [spotlightX, spotlightY, spotlightOpacity],
    ([x, y, op]: any[]) =>
      `radial-gradient(circle 250px at ${x}px ${y}px, rgba(0,0,0,${op}) 0%, rgba(0,0,0,${(op as number) * 0.4}) 50%, rgba(0,0,0,0) 100%)`
  );

  return (
    <section
      className="relative overflow-hidden bg-[#07111B] min-h-[calc(100vh-64px)] flex items-center justify-center py-20 px-4 md:px-8 cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* LAYER 1: Deep Navy Base Background & Fine Grid lines */}
      <div className="absolute inset-0 z-0 pointer-events-none" />
      <div className="absolute inset-0 landing-grid-fine opacity-20 z-0 pointer-events-none" />

      {/* Premium ambient mesh gradients (Soft cyan/blue/gold) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 10% 20%, rgba(0, 110, 181, 0.15) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(212, 160, 23, 0.08) 0%, transparent 50%)",
        }}
      />

      {/* LAYER 2: Hidden Facility Image revealed inside the cursor spotlight */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none select-none bg-no-repeat bg-cover bg-center"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
          backgroundImage: `url(${BRAND_ASSETS.entrance})`,
        }}
      />

      {/* LAYER 3: Cinematic Cursor glow highlighting the spotlight edges */}
      <motion.div
        style={{
          left: spotlightX,
          top: spotlightY,
          opacity: useTransform(spotlightOpacity, (op: number) => op * 0.2),
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(0, 174, 239, 0.4) 0%, transparent 70%)",
        }}
        className="absolute size-[600px] rounded-full pointer-events-none blur-2xl z-12"
      />

      {/* LAYER 4: Centered Content and Typography Console (always visible and crisp) */}
      <div className="relative z-20 max-w-4xl mx-auto w-full text-center space-y-8">
        
        {/* Security badge and controlled access indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md text-xs font-mono text-primary tracking-wider"
        >
          <Lock className="size-3.5 text-accent animate-pulse" />
          <span>CONTROLLED ACCESS</span>
          <span className="h-3 w-px bg-primary/20" />
          <span className="text-[#7D92A8]">SECURE SYSTEM</span>
        </motion.div>

        {/* Centralised Title Container - Luxury Glass Box Console */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="p-8 md:p-12 rounded-3xl border border-white/5 bg-[#0B2B4A]/10 backdrop-blur-md shadow-2xl space-y-6"
        >
          <h1 className="text-4xl md:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-none font-display font-bold">
            Scientific Infrastructure.
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#00AEEF] to-[#0090C8]">
              Reimagined.
            </span>
          </h1>

          <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto my-6" />

          {/* Centralized outcome messages */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <p className="text-xl md:text-2xl font-bold text-white/90">
              Trusted Analytical Intelligence.
            </p>
            <p className="text-md md:text-lg font-bold text-muted-foreground">
              Built for Institutions. Designed for Precision.
            </p>
          </div>

          {/* CTA Buttons in a centered row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link
              to="/register"
              className="btn-theme-cyan inline-flex items-center justify-center gap-2 min-w-[200px] text-base py-3.5 !rounded-xl shadow-lg"
            >
              Request Access <ArrowRight className="size-4" />
            </Link>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-theme-outline inline-flex items-center justify-center gap-2 min-w-[200px] text-base py-3.5 !rounded-xl backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-black hover:border-transparent transition-all"
            >
              Institutional Partnership
            </button>
          </div>
        </motion.div>

        {/* Footer info showing institutional credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/80 font-mono tracking-wider pt-4"
        >
          <span className="flex items-center gap-1.5">
            <Server className="size-3.5 text-primary" />
            POWERED BY UNIPOD
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <Shield className="size-3.5 text-accent" />
            ENCRYPTED SESSION
          </span>
          <span className="hidden sm:inline">·</span>
          <span>ESTABLISHED 2026</span>
        </motion.div>
      </div>

      {/* Secure Partnership Modal */}
      <PartnershipModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
