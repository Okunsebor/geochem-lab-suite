import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, ShieldCheck, Workflow, BarChart3, ScanBarcode,
  ArrowRight, CheckCircle2, Beaker, Building2, LineChart, Cpu, Sparkles
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "GeoChem Suite — Enterprise LIMS for Modern Labs" },
      { name: "description", content: "GeoChem Suite is a modern Laboratory Information Management System for geochemical analysis — sample intake to report delivery in one workflow." },
    ],
  }),
});

// Interactive 3D molecular structures rendering Quartz SiO2 and gold pyrite coordinates
interface Atom {
  x: number;
  y: number;
  z: number;
  symbol: string;
  label: string;
  color: string;
  radius: number;
  glow?: string;
}

interface Bond {
  a: number;
  b: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
}

function Scientific3DVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredAtom, setHoveredAtom] = useState<Atom | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<Atom | null>(null);
  
  // Custom 3D coordinates representing a hybrid geochemical SiO2 & Gold Pyrite lattice
  const atoms: Atom[] = [
    { x: 0, y: 0, z: 0, symbol: "Si", label: "Silicon (Center Node)", color: "#3b82f6", radius: 10, glow: "rgba(59, 130, 246, 0.4)" },
    { x: 0, y: 80, z: 0, symbol: "O", label: "Oxygen Alpha", color: "#ef4444", radius: 7 },
    { x: 0, y: -80, z: 0, symbol: "O", label: "Oxygen Beta", color: "#ef4444", radius: 7 },
    { x: 60, y: 0, z: 60, symbol: "Si", label: "Silicon Apex", color: "#3b82f6", radius: 9 },
    { x: -60, y: 0, z: 60, symbol: "Si", label: "Silicon Apex", color: "#3b82f6", radius: 9 },
    { x: 60, y: 0, z: -60, symbol: "Si", label: "Silicon Apex", color: "#3b82f6", radius: 9 },
    { x: -60, y: 0, z: -60, symbol: "Si", label: "Silicon Apex", color: "#3b82f6", radius: 9 },
    // Auric mineral nodes (Gold ore)
    { x: 110, y: 40, z: 20, symbol: "Au", label: "Gold Ore Inclusion", color: "#eab308", radius: 12, glow: "rgba(234, 179, 8, 0.5)" },
    { x: -110, y: -40, z: -20, symbol: "Au", label: "Gold Ore Inclusion", color: "#eab308", radius: 12, glow: "rgba(234, 179, 8, 0.5)" },
    { x: 20, y: -95, z: 70, symbol: "Au", label: "Auric Pyrite Node", color: "#eab308", radius: 11 },
    { x: -20, y: 95, z: -70, symbol: "Au", label: "Auric Pyrite Node", color: "#eab308", radius: 11 }
  ];

  const bonds: Bond[] = [
    { a: 0, b: 1 }, { a: 0, b: 2 },
    { a: 0, b: 3 }, { a: 0, b: 4 }, { a: 0, b: 5 }, { a: 0, b: 6 },
    { a: 3, b: 1 }, { a: 4, b: 1 }, { a: 5, b: 2 }, { a: 6, b: 2 },
    { a: 3, b: 7 }, { a: 5, b: 7 }, { a: 4, b: 8 }, { a: 6, b: 8 },
    { a: 1, b: 9 }, { a: 2, b: 10 }, { a: 7, b: 9 }, { a: 8, b: 10 }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let rotationX = 0.3;
    let rotationY = 0.5;
    let rotationSpeedX = 0.002;
    let rotationSpeedY = 0.003;
    
    // Mouse interaction states
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let targetRotationX = 0.3;
    let targetRotationY = 0.5;
    const damping = 0.08;
    
    let canvasWidth = 0;
    let canvasHeight = 0;

    // Handle high DPI retina screens
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvasWidth = rect.width;
      canvasHeight = rect.height;
      canvas.width = canvasWidth * window.devicePixelRatio;
      canvas.height = canvasHeight * window.devicePixelRatio;
      ctx.resetTransform();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Initialize floating chemical background elements (stars/atoms)
    const stars: Star[] = Array.from({ length: 40 }).map(() => ({
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
      z: (Math.random() - 0.5) * 400,
      size: Math.random() * 2 + 1
    }));

    let mouseX = -9999;
    let mouseY = -9999;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      if (isDragging) {
        const deltaX = e.clientX - previousMouseX;
        const deltaY = e.clientY - previousMouseY;
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleMouseLeave = () => {
      isDragging = false;
      mouseX = -9999;
      mouseY = -9999;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      const isDark = document.documentElement.classList.contains("dark");
      const primaryColor = isDark ? "#3b82f6" : "#2563eb";
      const bondColor = isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.09)";
      const bondHighlightColor = isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(37, 99, 235, 0.3)";
      const gridPatternColor = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)";
      
      // Interpolate current rotation with mouse target inputs (damped inertia orbit)
      if (!isDragging) {
        targetRotationX += rotationSpeedX;
        targetRotationY += rotationSpeedY;
      }
      rotationX += (targetRotationX - rotationX) * damping;
      rotationY += (targetRotationY - rotationY) * damping;

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const cameraDistance = 380;

      // Draw subtle grid dashboard crosshairs behind
      ctx.strokeStyle = gridPatternColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 100, centerY); ctx.lineTo(centerX + 100, centerY);
      ctx.moveTo(centerX, centerY - 100); ctx.lineTo(centerX, centerY + 100);
      ctx.stroke();

      // Transform background stars
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)";
      stars.forEach(s => {
        // Y-axis rotation
        let x1 = s.x * cosY - s.z * sinY;
        let z1 = s.x * sinY + s.z * cosY;
        // X-axis rotation
        let y2 = s.y * cosX - z1 * sinX;
        let z2 = s.y * sinX + z1 * cosX;

        const scale = cameraDistance / (cameraDistance + z2);
        const sx = centerX + x1 * scale;
        const sy = centerY + y2 * scale;

        if (sx >= 0 && sx <= canvasWidth && sy >= 0 && sy <= canvasHeight) {
          ctx.beginPath();
          ctx.arc(sx, sy, s.size * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Project Atoms
      const projectedAtoms = atoms.map((atom, idx) => {
        // Y-axis rotation
        let x1 = atom.x * cosY - atom.z * sinY;
        let z1 = atom.x * sinY + atom.z * cosY;
        // X-axis rotation
        let y2 = atom.y * cosX - z1 * sinX;
        let z2 = atom.y * sinX + z1 * cosX;

        const scale = cameraDistance / (cameraDistance + z2);
        const sx = centerX + x1 * scale;
        const sy = centerY + y2 * scale;

        // Check cursor collision for hover interaction states
        const dx = mouseX - sx;
        const dy = mouseY - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isHovered = dist < (atom.radius + 6);

        return {
          ...atom,
          sx,
          sy,
          sz: z2,
          scale,
          isHovered,
          index: idx
        };
      });

      // Find closest atom to cursor for single focus highlight
      const activeAtom = projectedAtoms
        .filter(pa => pa.isHovered)
        .sort((a, b) => a.sz - b.sz)[0] || null;

      // Update external hover state
      if (activeAtom) {
        setHoveredAtom(activeAtom);
      } else {
        setHoveredAtom(null);
      }

      // Draw Bonds (behind atoms in Z-index)
      ctx.lineWidth = 1.5;
      bonds.forEach(bond => {
        const aProj = projectedAtoms[bond.a];
        const bProj = projectedAtoms[bond.b];
        
        ctx.beginPath();
        ctx.moveTo(aProj.sx, aProj.sy);
        ctx.lineTo(bProj.sx, bProj.sy);
        
        const isBondHighlighted = (activeAtom && (activeAtom.index === bond.a || activeAtom.index === bond.b));
        ctx.strokeStyle = isBondHighlighted ? bondHighlightColor : bondColor;
        ctx.lineWidth = isBondHighlighted ? 2.5 : 1.2;
        ctx.stroke();
      });

      // Sort atoms back-to-front (Painter's algorithm)
      const sortedPa = [...projectedAtoms].sort((a, b) => b.sz - a.sz);

      // Draw Atoms
      sortedPa.forEach(pa => {
        const radius = pa.radius * pa.scale;
        
        // Dynamic node gradient
        const grad = ctx.createRadialGradient(
          pa.sx - radius * 0.3,
          pa.sy - radius * 0.3,
          radius * 0.05,
          pa.sx,
          pa.sy,
          radius
        );

        const isActive = activeAtom && activeAtom.index === pa.index;
        
        if (isActive) {
          // Vibrating glowing shadow
          ctx.shadowBlur = 18;
          ctx.shadowColor = pa.color;
          
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.3, pa.color);
          grad.addColorStop(1, "#000000");
        } else {
          ctx.shadowBlur = 0;
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.4, pa.color);
          grad.addColorStop(1, "rgba(0,0,0,0.85)");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pa.sx, pa.sy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle outer border ring
        ctx.strokeStyle = isActive ? pa.color : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)");
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.stroke();
        
        ctx.shadowBlur = 0; // Reset

        // Render symbol letters inside the active/hovered atoms
        if (pa.scale > 0.6) {
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${Math.max(7, Math.floor(7 * pa.scale))}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(pa.symbol, pa.sx, pa.sy);
        }
      });

      // Draw pointer tag connector line to the active hovered atom
      if (activeAtom) {
        ctx.strokeStyle = activeAtom.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(activeAtom.sx, activeAtom.sy);
        ctx.lineTo(activeAtom.sx + 40, activeAtom.sy - 30);
        ctx.lineTo(activeAtom.sx + 100, activeAtom.sy - 30);
        ctx.stroke();

        ctx.fillStyle = isDark ? "#ffffff" : "#000000";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "left";
        ctx.fillText(activeAtom.label, activeAtom.sx + 45, activeAtom.sy - 35);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative w-full h-[320px] md:h-[400px] flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        title="Left-click and drag to rotate Quartz chemical model"
      />
      
      {/* Absolute top dashboard indicators */}
      <div className="absolute top-4 left-4 text-left font-mono text-[9px] text-muted-foreground bg-muted/40 backdrop-blur-sm border border-border/50 py-1.5 px-2.5 rounded space-y-1 select-none pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          <span>SYS_MODEL: <span className="text-foreground">QUARTZ.SiO2</span></span>
        </div>
        <div>AXES_ROTATION: [X: {hoveredAtom ? "LOCK" : "AUTO"} · Y: AUTO]</div>
        <div>FPS_VAL: <span className="text-success font-semibold">60.00 Hz (GPU)</span></div>
      </div>

      <div className="absolute bottom-4 right-4 pointer-events-none">
        <AnimatePresence>
          {hoveredAtom && (
            <motion.div 
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="rounded-lg border border-border bg-card/90 backdrop-blur-md px-3.5 py-2 text-left shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full text-[9px] font-bold text-white font-mono" style={{ backgroundColor: hoveredAtom.color }}>
                  {hoveredAtom.symbol}
                </span>
                <span className="text-xs font-semibold text-foreground">{hoveredAtom.label}</span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1 font-mono">3D_COORD: [X: {hoveredAtom.x} · Y: {hoveredAtom.y} · Z: {hoveredAtom.z}]</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Stagger child animations configurations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
} as any;

const childRevealVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 90,
      damping: 14
    }
  }
} as any;

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="grid size-8 place-items-center rounded-md gradient-primary text-white transition-transform group-hover:scale-105 group-hover:rotate-6">
              <FlaskConical className="size-4" />
            </div>
            <span className="font-semibold tracking-tight transition-colors group-hover:text-primary">GeoChem Suite</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#platform" className="hover:text-foreground transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">Platform</a>
            <a href="#modules" className="hover:text-foreground transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">Modules</a>
            <a href="#analytics" className="hover:text-foreground transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">Analytics</a>
            <a href="#security" className="hover:text-foreground transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">Security</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Sign in</Link>
            <Link to="/app" className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-95 transition-all hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5">
              Launch app <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with split columns incorporating molecular visualizer */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 gradient-mesh opacity-90" />
        <div className="absolute inset-0 grid-pattern opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Column: Heading and CTAs */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7 text-left space-y-6"
            >
              <motion.div variants={childRevealVariants}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/75 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur-sm select-none">
                  <span className="size-2 rounded-full bg-success animate-pulse" />
                  Trusted by 240+ labs · ISO 17025 ready
                </span>
              </motion.div>
              
              <motion.h1 
                variants={childRevealVariants}
                className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.08]"
              >
                The modern <span className="text-gradient font-black">geochemical LIMS</span> built for production labs
              </motion.h1>
              
              <motion.p 
                variants={childRevealVariants}
                className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed"
              >
                From sample intake to certified report — one unified, real-time platform for chain-of-custody, 
                automated preparation steps, QA/QC anomaly flagging, and customer delivery.
              </motion.p>
              
              <motion.div 
                variants={childRevealVariants}
                className="flex flex-wrap items-center gap-3 pt-2"
              >
                <Link to="/app" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-5.5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-0.5">
                  Open live demo <ArrowRight className="size-4" />
                </Link>
                <Link to="/portal" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 backdrop-blur-sm px-5.5 py-3 text-sm font-semibold hover:bg-muted text-foreground transition-all hover:-translate-y-0.5">
                  Customer portal preview
                </Link>
              </motion.div>

              <motion.div 
                variants={childRevealVariants}
                className="grid grid-cols-3 gap-4 border-t border-border/60 pt-6 max-w-md text-xs font-semibold text-muted-foreground"
              >
                <div>
                  <span className="text-xl font-bold text-foreground block">99.8%</span>
                  Uptime guaranteed
                </div>
                <div>
                  <span className="text-xl font-bold text-foreground block">&lt; 3s</span>
                  Intake response
                </div>
                <div>
                  <span className="text-xl font-bold text-foreground block">Zero</span>
                  Manual sheet errors
                </div>
              </motion.div>
            </motion.div>
            
            {/* Right Column: 3D Crystal LIMS Viewport */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7, type: "spring" }}
              className="lg:col-span-5 relative"
            >
              <div className="rounded-2xl border border-border/80 bg-card/75 backdrop-blur-md shadow-2xl overflow-hidden relative group">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 bg-muted/20">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-destructive/60" />
                    <span className="size-2 rounded-full bg-warning/60" />
                    <span className="size-2 rounded-full bg-success/60" />
                    <span className="ml-2 text-[10px] text-muted-foreground font-mono font-bold tracking-wide">VIEWPORT-3D: CRYSTAL_LATTICE</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary text-[9px] font-mono font-bold">
                    <Sparkles className="size-3 animate-pulse" /> LIVE_RENDER
                  </div>
                </div>
                <Scientific3DVisualizer />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Modules with springy card scroll reveal */}
      <section id="modules" className="border-t border-border bg-card/25">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Core Modules</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              A complete laboratory workflow, end-to-end
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every stage of geochemical analysis instrumented — with physical barcodes, precise custody check-ins, automated duplicates spreads, and ISO calibration registries.
            </p>
          </div>
          
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { i: ScanBarcode, t: "Sample Intake", d: "Thermal label generation, scannable QR/Code-39 custody records, physical shelf mapping." },
              { i: Workflow, t: "Preparation", d: "Dynamic stages tracking for moisture extraction, pulverization, splitting, and core sawing." },
              { i: Beaker, t: "Analysis", d: "Real-time instrument queues for ICP-MS/OES, automated raw assay data hydration." },
              { i: ShieldCheck, t: "QA / QC Engine", d: "Duplicate spreads alerts, certified CRM controls mapping, and analytical flag isolates." },
              { i: BarChart3, t: "Reporting", d: "Branded PDF analytical certificates dispatch, double-verification protocols, email approvals." },
              { i: Building2, t: "Customer Portal", d: "Instant self-service custody trackers, secure download vault, and technical support desk." },
            ].map((m, idx) => (
              <motion.div 
                key={m.t} 
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 90, damping: 13 }}
                className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:bg-muted/10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <m.i className="size-5 transition-transform group-hover:scale-110" />
                </div>
                <h3 className="mt-4 font-bold text-foreground text-base group-hover:text-primary transition-colors">{m.t}</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{m.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Strip Section with Live Operations and Micro-animations */}
      <section id="platform" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Precision Platform</p>
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
              ].map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  key={item.title} 
                  className="flex gap-3"
                >
                  <CheckCircle2 className="size-4.5 text-success shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card p-6 shadow-xl relative overflow-hidden group"
          >
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
              ].map(([id, st, who, pct, styleClass]) => (
                <div 
                  key={id} 
                  className={`grid grid-cols-12 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold font-mono transition-all duration-300 hover:pl-4 cursor-default ${styleClass}`}
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
      </section>

      {/* Security pricing transition area */}
      <section id="security" className="border-t border-border bg-gradient-to-b from-background to-card/25">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Ready to digitize your lab operations?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience modern laboratory operations at scale. Spin up the sandbox demo system with sample barcode readers, analytical worksheets, and real Supabase integration instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to="/app" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-0.5">
              Launch live LIMS <ArrowRight className="size-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted text-foreground transition-all hover:-translate-y-0.5">
              Sign in to custody
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-muted/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-xs sm:text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="grid size-6 place-items-center rounded bg-primary text-white font-bold"><FlaskConical className="size-3" /></div>
            <span className="font-semibold text-foreground">© 2026 GeoChem Suite · ISO 17025 Compliant LIMS.</span>
          </div>
          <div className="flex gap-6 font-semibold">
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">Security Audit</a>
            <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
