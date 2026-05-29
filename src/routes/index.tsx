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

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface FloatingMineral {
  x: number;
  y: number;
  z: number;
  size: number;
  speedY: number;
  rot: number;
  rotSpeed: number;
  color: string;
  points: { x: number; y: number }[];
}

function CinematicGeologicalHeroVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let rotationX = 0.2;
    let rotationY = 0.4;
    let targetRotationX = 0.2;
    let targetRotationY = 0.4;
    const damping = 0.05;
    
    let mouseX = -9999;
    let mouseY = -9999;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    
    let canvasWidth = 0;
    let canvasHeight = 0;

    // QR scanner sweeping variables
    let scannerPhase = 0;

    // 1. Faceted geological crystal core definition (Icosahedron-like core)
    const vertices: Point3D[] = [
      { x: 0, y: -100, z: 0 },  // V0: Top Apex
      { x: 0, y: 100, z: 0 },   // V1: Bottom Apex
      // Mid-upper ring
      { x: 65, y: -30, z: 45 },  // V2
      { x: -65, y: -30, z: 45 }, // V3
      { x: -65, y: -30, z: -45 },// V4
      { x: 65, y: -30, z: -45 }, // V5
      // Mid-lower ring
      { x: 45, y: 35, z: 65 },   // V6
      { x: -45, y: 35, z: 65 },  // V7
      { x: -45, y: 35, z: -65 }, // V8
      { x: 45, y: 35, z: -65 },  // V9
    ];

    const faces = [
      [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 2], // Top cap
      [1, 6, 7], [1, 7, 8], [1, 8, 9], [1, 9, 6], // Bottom cap
      [2, 6, 3], [3, 7, 4], [4, 8, 5], [5, 9, 2], // Upper connectors
      [3, 6, 7], [4, 7, 8], [5, 8, 9], [2, 9, 6]  // Lower connectors
    ];

    // Facet mineral coloring (shading is computed dynamically)
    const faceColors = [
      "#1DA1E8", "#F4C430", "#f97316", "#1DA1E8",
      "#f97316", "#F4C430", "#1DA1E8", "#f97316",
      "#F4C430", "#1DA1E8", "#f97316", "#F4C430",
      "#1DA1E8", "#f97316", "#F4C430", "#1DA1E8"
    ];

    // 2. Fragment shards definition (Gold, Lithium, Copper)
    const fragmentColors = ["#F4C430", "#a5f3fc", "#f97316"];
    const fragmentSpeeds = [0.005, -0.008, 0.006];
    const fragmentRadius = [135, 165, 195];
    const fragmentInclination = [0.2, -0.4, 0.5];

    // 3. Floating Faceted Minerals (Gold, Silver, Chromium, Lithium, Amethyst Quartz)
    const minerals: FloatingMineral[] = Array.from({ length: 55 }).map(() => {
      const typeRand = Math.random();
      let color = "#334155"; // obsidian default
      let size = Math.random() * 8 + 4; // larger rock sizes

      if (typeRand > 0.85) {
        color = "#F4C430"; // Gold
      } else if (typeRand > 0.7) {
        color = "#e2e8f0"; // Silver
      } else if (typeRand > 0.55) {
        color = "#94a3b8"; // Chromium
      } else if (typeRand > 0.4) {
        color = "#1DA1E8"; // Lithium
      } else if (typeRand > 0.25) {
        color = "#c084fc"; // Amethyst Quartz
      } else if (typeRand > 0.12) {
        color = "#f97316"; // Copper ore
      }

      // Generate random jagged faceted stone coordinates
      const pointsCount = 5 + Math.floor(Math.random() * 3);
      const points = [];
      for (let i = 0; i < pointsCount; i++) {
        const angle = (i / pointsCount) * Math.PI * 2;
        const r = size * (0.6 + Math.random() * 0.5);
        points.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r
        });
      }

      return {
        x: (Math.random() - 0.5) * 600,
        y: Math.random() * 500 - 250,
        z: (Math.random() - 0.5) * 400,
        size,
        speedY: -(Math.random() * 0.35 + 0.15), // float upwards
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.005,
        color,
        points
      };
    });

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

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotationY += deltaX * 0.004;
        targetRotationX += deltaY * 0.004;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        // Subtle hover parallax target coordinates
        targetRotationY = 0.4 + (mouseX - canvasWidth / 2) * 0.0005;
        targetRotationX = 0.2 + (mouseY - canvasHeight / 2) * 0.0005;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      const isDark = document.documentElement.classList.contains("dark");
      
      // Update rotational angle with damp easing
      rotationX += (targetRotationX - rotationX) * damping;
      rotationY += (targetRotationY - rotationY) * damping;

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const cameraDistance = 420;

      // 1. Draw floating faceted minerals (Gold, Silver, Chromium, Lithium, Quartz, copper, obsidian stones)
      minerals.forEach(p => {
        p.y += p.speedY;
        if (p.y < -300) {
          p.y = 300; // Reset below screen to keep continuous upward float!
          p.x = (Math.random() - 0.5) * canvasWidth;
        }
        
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        const scale = cameraDistance / (cameraDistance + z2);
        const sx = centerX + x1 * scale;
        const sy = centerY + y2 * scale;

        if (sx >= -50 && sx <= canvasWidth + 50 && sy >= -50 && sy <= canvasHeight + 50) {
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(p.rot + scannerPhase * p.rotSpeed);

          // Faceted rock body
          ctx.beginPath();
          p.points.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x * scale, pt.y * scale);
            else ctx.lineTo(pt.x * scale, pt.y * scale);
          });
          ctx.closePath();

          ctx.fillStyle = p.color;
          ctx.globalAlpha = isDark ? 0.15 : 0.22; // subtle backdrop opacity to keep text highly legible!
          ctx.fill();

          // Highlighted faceted border
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.9;
          ctx.globalAlpha = isDark ? 0.35 : 0.45;
          ctx.stroke();

          ctx.restore();
          ctx.globalAlpha = 1.0; // Reset
        }
      });

      // 2. Project vertices of geological crystal core
      const projectedVertices = vertices.map(v => {
        let x1 = v.x * cosY - v.z * sinY;
        let z1 = v.x * sinY + v.z * cosY;
        let y2 = v.y * cosX - z1 * sinX;
        let z2 = v.y * sinX + z1 * cosX;

        const scale = cameraDistance / (cameraDistance + z2);
        return {
          x: centerX + x1 * scale,
          y: centerY + y2 * scale,
          z: z2
        };
      });

      // 3. Facet math flat shading and sorting
      const sortedFaces = faces.map((face, index) => {
        const v0 = projectedVertices[face[0]];
        const v1 = projectedVertices[face[1]];
        const v2 = projectedVertices[face[2]];
        
        // Average depth of face
        const depth = (v0.z + v1.z + v2.z) / 3;

        // Vector normal math
        const ux = v1.x - v0.x;
        const uy = v1.y - v0.y;
        const vx = v2.x - v0.x;
        const vy = v2.y - v0.y;
        const normalZ = ux * vy - uy * vx;

        return { face, index, depth, normalZ };
      }).sort((a, b) => b.depth - a.depth);

      // 4. Draw crystalline facets
      sortedFaces.forEach(f => {
        // Back-face culling logic
        if (f.normalZ < 0) return;

        const face = f.face;
        const color = faceColors[f.index];
        
        // Simple directional lighting dot product
        const shadow = Math.max(0.15, Math.min(0.85, (f.depth + 100) / 250));
        
        ctx.beginPath();
        ctx.moveTo(projectedVertices[face[0]].x, projectedVertices[face[0]].y);
        ctx.lineTo(projectedVertices[face[1]].x, projectedVertices[face[1]].y);
        ctx.lineTo(projectedVertices[face[2]].x, projectedVertices[face[2]].y);
        ctx.closePath();

        // Shading composite fill
        ctx.fillStyle = color;
        ctx.globalAlpha = isDark ? 0.35 : 0.45;
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset
      });

      // 5. Draw rotating metallic shards (satellite mineral orbits)
      scannerPhase += 0.015;
      fragmentColors.forEach((color, idx) => {
        const speed = fragmentSpeeds[idx];
        const rad = fragmentRadius[idx];
        const inc = fragmentInclination[idx];
        const angle = scannerPhase * speed * 80;

        // Position coordinates along inclined orbits
        const fx = Math.cos(angle) * rad;
        const fz = Math.sin(angle) * rad;
        const fy = Math.sin(angle) * Math.sin(inc) * rad * 0.4;

        // Transform relative to general viewport rotation
        let x1 = fx * cosY - fz * sinY;
        let z1 = fx * sinY + fz * cosY;
        let y2 = (fy * cosX - z1 * sinX);
        let z2 = (fy * sinX + z1 * cosX);

        const scale = cameraDistance / (cameraDistance + z2);
        const sx = centerX + x1 * scale;
        const sy = centerY + y2 * scale;

        // Draw satellite crystal shard
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle * 1.5);
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        // Draw diamond shard face
        ctx.beginPath();
        ctx.moveTo(0, -6 * scale);
        ctx.lineTo(4 * scale, 0);
        ctx.lineTo(0, 6 * scale);
        ctx.lineTo(-4 * scale, 0);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      });

      // 6. Immersive QR Holographic Scan Lines (Sweeping horizontal plane)
      const sweepYOffset = Math.sin(scannerPhase) * 110;
      const laserY = centerY + sweepYOffset * cosX;

      // Draw horizontal holographic line across LIMS viewport
      ctx.save();
      const grad = ctx.createLinearGradient(centerX - 160, laserY, centerX + 160, laserY);
      grad.addColorStop(0, "rgba(29, 161, 232, 0)");
      grad.addColorStop(0.5, "rgba(29, 161, 232, 0.85)");
      grad.addColorStop(1, "rgba(29, 161, 232, 0)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#1DA1E8";
      ctx.beginPath();
      ctx.moveTo(centerX - 160, laserY);
      ctx.lineTo(centerX + 160, laserY);
      ctx.stroke();
      ctx.restore();

      // Draw telemetry scanning HUD
      ctx.strokeStyle = "rgba(29, 161, 232, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 130, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // 7. Geological Terrain Depth Layers (Curved layered silhouettes at the bottom)
      const terrainShift = (mouseX !== -9999 ? (mouseX - centerX) * 0.08 : 0);
      
      // Bottom Layer 1
      ctx.fillStyle = isDark ? "rgba(13, 23, 35, 0.65)" : "rgba(226, 232, 240, 0.85)";
      ctx.beginPath();
      ctx.moveTo(0, canvasHeight);
      ctx.quadraticCurveTo(
        canvasWidth * 0.4 + terrainShift,
        canvasHeight - 65,
        canvasWidth,
        canvasHeight - 20
      );
      ctx.lineTo(canvasWidth, canvasHeight);
      ctx.closePath();
      ctx.fill();

      // Bottom Layer 2
      ctx.fillStyle = isDark ? "rgba(7, 17, 28, 0.8)" : "rgba(203, 213, 225, 0.95)";
      ctx.beginPath();
      ctx.moveTo(0, canvasHeight);
      ctx.quadraticCurveTo(
        canvasWidth * 0.65 - terrainShift,
        canvasHeight - 45,
        canvasWidth,
        canvasHeight - 35
      );
      ctx.lineTo(canvasWidth, canvasHeight);
      ctx.closePath();
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        title="Interact with geological mineral core visualizer"
      />
      
      {/* Holographic Digital Overlay HUD */}
      <div className="absolute top-6 left-6 text-left font-mono text-[9px] text-primary/70 bg-card/20 backdrop-blur-md border border-primary/20 py-2 px-3 rounded space-y-1 select-none pointer-events-none tracking-wider z-10">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <span>ORE_METALLICITY: <span className="text-foreground">GOLD_LITHIUM_COPPER</span></span>
        </div>
        <div>SYS_LOCK: <span className="text-success font-bold font-mono">TRACKING_ACTIVE</span></div>
        <div>SCANNER_GRID: <span className="text-accent font-bold">QR_BARCODE_READY</span></div>
      </div>

      <div className="absolute bottom-6 right-6 font-mono text-[8px] text-muted-foreground bg-card/25 py-1.5 px-2.5 border border-border/40 rounded pointer-events-none select-none tracking-widest z-10">
        COORD_DEPTH: [Z_CAMERA: 420.00]
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

      {/* Fullscreen Immersive Centered Hero Section */}
      <section className="relative overflow-hidden border-b border-border/20 bg-background min-h-[calc(100vh-64px)] flex items-center justify-center">
        {/* Soft atmospheric gradient mesh */}
        <div className="absolute inset-0 gradient-mesh opacity-60 z-0" />
        <div className="absolute inset-0 grid-pattern opacity-10 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] z-0" />
        
        {/* Fullscreen 3D Geological Visualizer Canvas Backdrop */}
        <div className="absolute inset-0 w-full h-full z-0 opacity-80 pointer-events-none select-none">
          <CinematicGeologicalHeroVisualizer />
        </div>

        {/* Center-Aligned Content Container */}
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center z-10 flex flex-col items-center justify-center space-y-8 select-none">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center space-y-8"
          >
            <motion.div variants={childRevealVariants}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-bold font-mono tracking-widest text-primary uppercase select-none">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                UNDP Integrated · ISO 17025 Ready
              </span>
            </motion.div>
            
            <motion.h1 
              variants={childRevealVariants}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl text-foreground leading-[1.05] font-display max-w-3xl"
            >
              Track Every <span className="text-gradient font-black">Geological Sample</span> With Scientific Precision.
            </motion.h1>
            
            <motion.p 
              variants={childRevealVariants}
              className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed font-sans"
            >
              GeoChem Suite digitizes laboratory workflows from intake to analytical reporting. Secure custodial tracking, automatic preparation tracking, and instant QA/QC flagging.
            </motion.p>
            
            <motion.div 
              variants={childRevealVariants}
              className="flex flex-wrap items-center justify-center gap-4 pt-2"
            >
              <Link to="/app" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/10 hover:shadow-primary/25 transition-all hover:-translate-y-0.5 active-scale-spring font-display">
                Launch Platform <ArrowRight className="size-4" />
              </Link>
              <Link to="/portal" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/45 backdrop-blur-md px-8 py-4 text-sm font-semibold hover:bg-muted text-foreground transition-all hover:-translate-y-0.5 active-scale-spring font-display">
                Request Demo
              </Link>
            </motion.div>

            <motion.div 
              variants={childRevealVariants}
              className="grid grid-cols-3 gap-8 sm:gap-12 border-t border-border/40 pt-8 w-full max-w-2xl text-[10px] font-bold font-mono uppercase tracking-widest text-muted-foreground"
            >
              <div>
                <span className="text-2xl sm:text-3xl font-black text-foreground block font-display">99.98%</span>
                Uptime Guaranteed
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-foreground block font-display">&lt; 1.5s</span>
                Intake Latency
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-foreground block font-display">Zero</span>
                Manual Errors
              </div>
            </motion.div>
          </motion.div>
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
