import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, ShieldCheck, Workflow, BarChart3, ScanBarcode,
  ArrowRight, CheckCircle2, Beaker, Building2, LineChart, Cpu, Sparkles
} from "lucide-react";

// Real Mineral image assets
import chromiumImg from "../../assets/minerals/chromium.png";
import copperImg from "../../assets/minerals/copper.png";
import diamondImg from "../../assets/minerals/diamond.png";
import goldOreImg from "../../assets/minerals/gold ore.png";
import lithiumOreImg from "../../assets/minerals/lithium ore.png";
import rockImg from "../../assets/textures/rock.png";

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

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  imageIndex: number;
  color: string;
}

// Helper function to clean checkered backgrounds from mineral specimen images using BFS flood-fill
function cleanImageBackground(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0);

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Helper to identify gray/white checkerboard pixel
  const isBg = (r: number, g: number, b: number, a: number) => {
    if (a === 0) return true; // already transparent
    const isMonochrome = Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && Math.abs(b - r) < 12;
    if (!isMonochrome) return false;
    // Cover anything from light gray to white: e.g. RGB > 185
    return r > 185;
  };

  const queue: [number, number][] = [];
  const visited = new Uint8Array(w * h);

  // Border pixel initializer
  for (let x = 0; x < w; x++) {
    // Top border
    const idxTop = x;
    if (isBg(data[idxTop * 4], data[idxTop * 4 + 1], data[idxTop * 4 + 2], data[idxTop * 4 + 3])) {
      queue.push([x, 0]);
      visited[idxTop] = 1;
    }
    // Bottom border
    const idxBot = (h - 1) * w + x;
    if (isBg(data[idxBot * 4], data[idxBot * 4 + 1], data[idxBot * 4 + 2], data[idxBot * 4 + 3])) {
      queue.push([x, h - 1]);
      visited[idxBot] = 1;
    }
  }

  for (let y = 0; y < h; y++) {
    // Left border
    const idxLeft = y * w;
    if (isBg(data[idxLeft * 4], data[idxLeft * 4 + 1], data[idxLeft * 4 + 2], data[idxLeft * 4 + 3])) {
      if (!visited[idxLeft]) {
        queue.push([0, y]);
        visited[idxLeft] = 1;
      }
    }
    // Right border
    const idxRight = y * w + (w - 1);
    if (isBg(data[idxRight * 4], data[idxRight * 4 + 1], data[idxRight * 4 + 2], data[idxRight * 4 + 3])) {
      if (!visited[idxRight]) {
        queue.push([w - 1, y]);
        visited[idxRight] = 1;
      }
    }
  }

  // BFS Queue loop
  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const idx = (cy * w + cx) * 4;
    data[idx + 3] = 0; // set alpha to transparent

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nIdx = ny * w + nx;
        if (!visited[nIdx]) {
          const nr = data[nIdx * 4];
          const ng = data[nIdx * 4 + 1];
          const nb = data[nIdx * 4 + 2];
          const na = data[nIdx * 4 + 3];
          if (isBg(nr, ng, nb, na)) {
            queue.push([nx, ny]);
            visited[nIdx] = 1;
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function CinematicGeologicalHeroVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let rotationX = 0.15;
    let rotationY = 0.3;
    let targetRotationX = 0.15;
    let targetRotationY = 0.3;
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

    // Load real rock/mineral images inside Canvas preloader
    const imgUrls = [chromiumImg, copperImg, diamondImg, goldOreImg, lithiumOreImg, rockImg];
    const preloadedImages: (HTMLImageElement | HTMLCanvasElement)[] = [];
    imgUrls.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const cleanedCanvas = cleanImageBackground(img);
        preloadedImages[index] = cleanedCanvas;
      };
      preloadedImages.push(img);
    });

    // 3. Atmospheric drifting particles - strictly limited to at most 5 floating specimen pods
    const particles: Particle[] = Array.from({ length: 5 }).map(() => ({
      x: (Math.random() - 0.5) * 550,
      y: (Math.random() - 0.5) * 550,
      z: (Math.random() - 0.5) * 450,
      size: Math.random() * 0.4 + 0.5, // further reduced and optimized size for professional layout
      speedY: -(Math.random() * 0.22 + 0.10), // slow, premium continuous floating drift
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.006,
      imageIndex: Math.floor(Math.random() * imgUrls.length),
      color: Math.random() > 0.5 ? "#1DA1E8" : "#F4C430"
    }));

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
        targetRotationY = 0.3 + (mouseX - canvasWidth / 2) * 0.0003;
        targetRotationX = 0.15 + (mouseY - canvasHeight / 2) * 0.0003;
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

      // 1. Draw atmospheric particles (real mineral specimen pods)
      particles.forEach(p => {
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        if (p.y < -280) p.y = 280; // wrap around
        
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        const scale = cameraDistance / (cameraDistance + z2);
        const sx = centerX + x1 * scale;
        const sy = centerY + y2 * scale;

        if (sx >= -50 && sx <= canvasWidth + 50 && sy >= -50 && sy <= canvasHeight + 50) {
          const img = preloadedImages[p.imageIndex];
          const isLoaded = img instanceof HTMLCanvasElement || (img && img.complete && img.naturalWidth !== 0);
          if (isLoaded) {
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(p.rotation);
            
            // Reduced and optimized size for a professional, elegant spacing
            const size = p.size * scale * 11; 
            
            // Draw preloaded mineral directly (no circular pod, no checkered background)
            ctx.globalAlpha = Math.max(0.20, Math.min(0.85, scale * 0.95));
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
            
            ctx.restore();
            ctx.globalAlpha = 1.0;
          } else {
            // Fallback glow dot if image is loading
            ctx.beginPath();
            ctx.arc(sx, sy, p.size * scale * 2, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.35;
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
        }
      });

      // [REMOVED] Giant abstract crystalline core projection completely removed to declutter hero page

      // 6. Holographic Barcode Laser Sweep (Subtle vertical scan sweep line)
      scannerPhase += 0.012;
      const sweepYOffset = Math.sin(scannerPhase) * 110;
      const laserY = centerY + sweepYOffset * cosX;

      // Draw horizontal holographic laser scan
      ctx.save();
      const grad = ctx.createLinearGradient(centerX - 160, laserY, centerX + 160, laserY);
      grad.addColorStop(0, "rgba(29, 161, 232, 0)");
      grad.addColorStop(0.5, "rgba(29, 161, 232, 0.35)"); // reduced opacity for subtle, clean visual
      grad.addColorStop(1, "rgba(29, 161, 232, 0)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#1DA1E8";
      ctx.beginPath();
      ctx.moveTo(centerX - 160, laserY);
      ctx.lineTo(centerX + 160, laserY);
      ctx.stroke();
      ctx.restore();

      // Draw subtle telemetry circular scanning HUD
      ctx.strokeStyle = "rgba(29, 161, 232, 0.06)"; // extremely subtle
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
      const terrainShift = (mouseX !== -9999 ? (mouseX - centerX) * 0.05 : 0);
      
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
    <div className="relative w-full h-[360px] md:h-[450px] flex items-center justify-center overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        title="Geological LIMS scanning viewport"
      />
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
        {/* Immersive 3D Background Canvas Visualizer */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-80">
          <CinematicGeologicalHeroVisualizer />
        </div>

        {/* Soft atmospheric gradient mesh */}
        <div className="absolute inset-0 gradient-mesh opacity-45 pointer-events-none" />
        <div className="absolute inset-0 grid-pattern opacity-10 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none" />
        
        {/* Centered Content Container */}
        <div className="relative mx-auto max-w-5xl px-6 py-20 w-full z-10 text-center flex flex-col items-center justify-center space-y-8 select-none">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center text-center space-y-8 max-w-4xl"
          >
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
              <Link to="/app" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all hover:-translate-y-0.5 active-scale-spring font-display">
                Launch Platform <ArrowRight className="size-4" />
              </Link>
              <Link to="/portal" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/45 backdrop-blur-md px-7 py-4 text-sm font-semibold hover:bg-muted text-foreground transition-all hover:-translate-y-0.5 active-scale-spring font-display">
                Request Demo
              </Link>
            </motion.div>

            <motion.div 
              variants={childRevealVariants}
              className="grid grid-cols-3 gap-8 border-t border-border/40 pt-8 max-w-2xl w-full text-[10px] font-bold font-mono uppercase tracking-widest text-muted-foreground justify-center mx-auto"
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
          <div className="max-w-3xl text-center mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Core Modules</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display">
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
