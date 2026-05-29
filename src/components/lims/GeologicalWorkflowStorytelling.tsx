import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import {
  ScanBarcode, ShieldCheck, Flame, Hammer, GitFork,
  Disc3, Microscope, FileCheck2,
} from "lucide-react";

// ─── Workflow Step Definitions ──────────────────────────────────────────────
const WORKFLOW_STEPS = [
  {
    id: "intake",
    icon: ScanBarcode,
    title: "Sample Intake",
    subtitle: "Custody Registration",
    description: "Inbound drill core specimens are scanned, weighed, and registered into the LIMS custody chain with unique barcode tracking.",
    hud: [
      { label: "SAMPLE ID", value: "GCS-24012" },
      { label: "WEIGHT", value: "1.42 kg" },
      { label: "CONTAINER", value: "Calico Bag" },
      { label: "LOCATION", value: "Rack A-1" },
    ],
    color: "#1DA1E8",
  },
  {
    id: "verification",
    icon: ShieldCheck,
    title: "Verification",
    subtitle: "Physical Inspection",
    description: "Dimensional measurements and physical integrity checks verify specimen identity, mass, and structural consistency.",
    hud: [
      { label: "LENGTH", value: "204.2 mm" },
      { label: "DIAMETER", value: "50.4 mm" },
      { label: "DENSITY", value: "2.7 g/cm³" },
      { label: "INTEGRITY", value: "PASS" },
    ],
    color: "#10b981",
  },
  {
    id: "drying",
    icon: Flame,
    title: "Drying",
    subtitle: "Moisture Extraction",
    description: "Controlled thermal extraction removes residual moisture to stabilize sample mass for accurate downstream analysis.",
    hud: [
      { label: "TEMPERATURE", value: "105°C" },
      { label: "MOISTURE", value: "0.05%" },
      { label: "DURATION", value: "4h 22m" },
      { label: "TARGET", value: "< 0.1%" },
    ],
    color: "#F4C430",
  },
  {
    id: "crushing",
    icon: Hammer,
    title: "Crushing",
    subtitle: "Primary Reduction",
    description: "Jaw crushers reduce whole-core specimens to coarse fragments for homogeneous sub-sampling and preparation.",
    hud: [
      { label: "PRESSURE", value: "2.4 MPa" },
      { label: "INPUT", value: "50 mm" },
      { label: "OUTPUT", value: "< 2 mm" },
      { label: "FRAGMENTS", value: "142" },
    ],
    color: "#ef4444",
  },
  {
    id: "splitting",
    icon: GitFork,
    title: "Splitting",
    subtitle: "Representative Division",
    description: "Riffle splitters divide crushed material into statistically equivalent sub-samples for duplicate analysis paths.",
    hud: [
      { label: "SPLIT A", value: "710.1 g" },
      { label: "SPLIT B", value: "709.9 g" },
      { label: "VARIANCE", value: "0.03%" },
      { label: "BARCODE B", value: "GCS-24012-B" },
    ],
    color: "#8b5cf6",
  },
  {
    id: "pulverizing",
    icon: Disc3,
    title: "Pulverizing",
    subtitle: "Fine Grinding",
    description: "Ring mills reduce split material to analytical-grade powder, ensuring complete element liberation for assay accuracy.",
    hud: [
      { label: "SPEED", value: "850 RPM" },
      { label: "MESH", value: "75 µm" },
      { label: "DURATION", value: "3m 15s" },
      { label: "YIELD", value: "99.2%" },
    ],
    color: "#06b6d4",
  },
  {
    id: "analysis",
    icon: Microscope,
    title: "Analysis",
    subtitle: "Instrumental Assay",
    description: "ICP-MS, AAS, and XRF instruments determine elemental concentrations with certified reference material validation.",
    hud: [
      { label: "Au", value: "2.45 g/t" },
      { label: "Li", value: "1.15%" },
      { label: "Cu", value: "0.85%" },
      { label: "INSTRUMENT", value: "ICP-MS-01" },
    ],
    color: "#1DA1E8",
  },
  {
    id: "report",
    icon: FileCheck2,
    title: "Report Generation",
    subtitle: "Certified Delivery",
    description: "Branded analytical certificates are compiled with QA/QC validation, digital signatures, and ISO 17025 compliance seals.",
    hud: [
      { label: "REPORT", value: "RPT-2041" },
      { label: "STANDARD", value: "ISO 17025" },
      { label: "VERIFIED", value: "2× APPROVED" },
      { label: "STATUS", value: "DISPATCHED" },
    ],
    color: "#10b981",
  },
];

// ─── Canvas Drawing Helpers ─────────────────────────────────────────────────

function drawIntake(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2, cy = h / 2;
  // Drill core wireframe
  ctx.strokeStyle = "rgba(29,161,232,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - 40, cy - 70, 80, 140, 6);
  ctx.stroke();
  // Internal striations
  for (let i = 0; i < 5; i++) {
    const y = cy - 50 + i * 25;
    ctx.strokeStyle = `rgba(29,161,232,${0.08 + i * 0.03})`;
    ctx.beginPath();
    ctx.moveTo(cx - 30, y);
    ctx.lineTo(cx + 30, y);
    ctx.stroke();
  }
  // QR scanning grid
  const scanY = cy - 70 + ((Math.sin(t * 1.8) + 1) / 2) * 140;
  ctx.strokeStyle = "#1DA1E8";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#1DA1E8";
  ctx.beginPath();
  ctx.moveTo(cx - 50, scanY);
  ctx.lineTo(cx + 50, scanY);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Corner brackets
  const corners = [[-55, -80], [55, -80], [-55, 80], [55, 80]];
  ctx.strokeStyle = "rgba(29,161,232,0.6)";
  ctx.lineWidth = 2;
  corners.forEach(([ox, oy]) => {
    const x = cx + ox, y = cy + oy;
    const dx = ox > 0 ? -12 : 12, dy = oy > 0 ? -12 : 12;
    ctx.beginPath();
    ctx.moveTo(x + dx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy);
    ctx.stroke();
  });
  // Pulsing registration dot
  const pulse = 0.5 + Math.sin(t * 3) * 0.5;
  ctx.fillStyle = `rgba(29,161,232,${0.3 + pulse * 0.7})`;
  ctx.beginPath();
  ctx.arc(cx + 55, cy - 80, 3 + pulse * 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawVerification(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2, cy = h / 2;
  // Core outline
  ctx.strokeStyle = "rgba(16,185,129,0.3)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - 40, cy - 70, 80, 140, 6);
  ctx.stroke();
  // Dimensional measurement lines
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  // Height dimension
  ctx.beginPath();
  ctx.moveTo(cx - 60, cy - 70);
  ctx.lineTo(cx - 60, cy + 70);
  ctx.stroke();
  // Width dimension
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy + 85);
  ctx.lineTo(cx + 40, cy + 85);
  ctx.stroke();
  ctx.setLineDash([]);
  // Caliper arrows
  const arrowLen = 5;
  [[cx - 60, cy - 70, 0, 1], [cx - 60, cy + 70, 0, -1], [cx - 40, cy + 85, 1, 0], [cx + 40, cy + 85, -1, 0]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x as number, y as number);
    ctx.lineTo((x as number) + (dy as number) * arrowLen - (dx as number) * arrowLen, (y as number) + (dx as number) * arrowLen + (dy as number) * arrowLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x as number, y as number);
    ctx.lineTo((x as number) - (dy as number) * arrowLen - (dx as number) * arrowLen, (y as number) - (dx as number) * arrowLen + (dy as number) * arrowLen);
    ctx.stroke();
  });
  // Concentric ultrasonic pulses
  for (let i = 0; i < 3; i++) {
    const r = 20 + ((t * 30 + i * 40) % 100);
    const alpha = Math.max(0, 1 - r / 100) * 0.3;
    ctx.strokeStyle = `rgba(16,185,129,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawDrying(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2, cy = h / 2;
  // Oven plate
  ctx.strokeStyle = "rgba(244,196,48,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 60, cy + 50);
  ctx.lineTo(cx + 60, cy + 50);
  ctx.stroke();
  // Core on plate
  ctx.strokeStyle = "rgba(244,196,48,0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - 30, cy - 30, 60, 80, 4);
  ctx.stroke();
  // Rising heat vapors
  for (let i = 0; i < 8; i++) {
    const x = cx - 25 + (i / 7) * 50;
    const phase = t * 1.2 + i * 0.8;
    const yOff = ((phase % 3) / 3) * 100;
    const alpha = Math.max(0, 1 - yOff / 100) * 0.4;
    ctx.strokeStyle = `rgba(244,196,48,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const baseY = cy - 30 - yOff;
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + Math.sin(phase * 2) * 6, baseY - 10, x + Math.sin(phase * 2) * 3, baseY - 20);
    ctx.stroke();
  }
  // Heat glow from plate
  const glowAlpha = 0.05 + Math.sin(t * 2) * 0.03;
  const grad = ctx.createRadialGradient(cx, cy + 50, 0, cx, cy + 50, 80);
  grad.addColorStop(0, `rgba(244,196,48,${glowAlpha})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(cx - 80, cy - 30, 160, 90);
}

function drawCrushing(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2, cy = h / 2;
  // Jaw outlines
  ctx.strokeStyle = "rgba(239,68,68,0.3)";
  ctx.lineWidth = 2;
  const jawGap = 20 + Math.sin(t * 3) * 8;
  // Left jaw
  ctx.beginPath();
  ctx.moveTo(cx - 50, cy - 60);
  ctx.lineTo(cx - jawGap, cy);
  ctx.lineTo(cx - 50, cy + 60);
  ctx.stroke();
  // Right jaw
  ctx.beginPath();
  ctx.moveTo(cx + 50, cy - 60);
  ctx.lineTo(cx + jawGap, cy);
  ctx.lineTo(cx + 50, cy + 60);
  ctx.stroke();
  // Fragments falling
  const seed = 42;
  for (let i = 0; i < 12; i++) {
    const hash = Math.sin(seed + i * 137.5);
    const fx = cx + (hash * 40);
    const fallPhase = (t * 0.8 + i * 0.3) % 4;
    const fy = cy + fallPhase * 30 - 10;
    const size = 2 + Math.abs(hash) * 4;
    const alpha = Math.max(0, Math.min(0.7, 1 - (fy - cy) / 100));
    if (fy > cy - 20 && fy < cy + 80) {
      ctx.fillStyle = `rgba(239,68,68,${alpha})`;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(t + i);
      ctx.fillRect(-size / 2, -size / 2, size, size * 0.7);
      ctx.restore();
    }
  }
  // Pressure indicators
  ctx.strokeStyle = "rgba(239,68,68,0.15)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const y = cy - 40 + i * 40;
    ctx.beginPath();
    ctx.moveTo(cx - 60, y);
    ctx.lineTo(cx + 60, y);
    ctx.stroke();
  }
}

function drawSplitting(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2, cy = h / 2;
  // Splitter divider
  ctx.strokeStyle = "rgba(139,92,246,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 60);
  ctx.lineTo(cx, cy + 20);
  ctx.stroke();
  // Funnel top
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy - 60);
  ctx.lineTo(cx + 40, cy - 60);
  ctx.stroke();
  // Split channels
  ctx.beginPath();
  ctx.moveTo(cx, cy + 20);
  ctx.lineTo(cx - 40, cy + 60);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + 20);
  ctx.lineTo(cx + 40, cy + 60);
  ctx.stroke();
  // Falling particles into channels
  for (let i = 0; i < 8; i++) {
    const phase = (t * 1.2 + i * 0.5) % 3;
    const prog = phase / 3;
    const goLeft = i % 2 === 0;
    let px: number, py: number;
    if (prog < 0.4) {
      px = cx;
      py = cy - 60 + prog * 200;
    } else {
      const sub = (prog - 0.4) / 0.6;
      px = cx + (goLeft ? -1 : 1) * sub * 40;
      py = cy + 20 + sub * 40;
    }
    const alpha = 0.3 + (1 - prog) * 0.5;
    ctx.fillStyle = `rgba(139,92,246,${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Balance indicators
  const balA = 710.1 + Math.sin(t * 2) * 0.05;
  const balB = 709.9 + Math.cos(t * 2) * 0.05;
  ctx.fillStyle = "rgba(139,92,246,0.5)";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${balA.toFixed(1)}g`, cx - 40, cy + 78);
  ctx.fillText(`${balB.toFixed(1)}g`, cx + 40, cy + 78);
}

function drawPulverizing(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2, cy = h / 2;
  // Ring mill outline
  ctx.strokeStyle = "rgba(6,182,212,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.stroke();
  // Orbital dust particles
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2 + t * 2.5;
    const r = 25 + Math.sin(i * 3 + t) * 12;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    const size = 1 + Math.sin(i + t * 3) * 0.5;
    const alpha = 0.2 + Math.sin(i * 2 + t) * 0.15;
    ctx.fillStyle = `rgba(6,182,212,${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
  // Center vortex
  const vortexAlpha = 0.04 + Math.sin(t * 3) * 0.02;
  const vGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
  vGrad.addColorStop(0, `rgba(6,182,212,${vortexAlpha})`);
  vGrad.addColorStop(1, "transparent");
  ctx.fillStyle = vGrad;
  ctx.fillRect(cx - 30, cy - 30, 60, 60);
}

function drawAnalysis(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2, cy = h / 2;
  // Atomic nucleus
  ctx.fillStyle = "rgba(29,161,232,0.3)";
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  // Electron orbits
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = `rgba(29,161,232,${0.12 + i * 0.05})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 45, 20, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Electron on orbit
    const eAngle = t * (1.5 + i * 0.5);
    const ex = Math.cos(eAngle) * 45;
    const ey = Math.sin(eAngle) * 20;
    ctx.fillStyle = `rgba(29,161,232,${0.6 + Math.sin(t + i) * 0.3})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Spectral peaks below
  const peakY = cy + 65;
  ctx.strokeStyle = "rgba(29,161,232,0.2)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - 60, peakY);
  ctx.lineTo(cx + 60, peakY);
  ctx.stroke();
  // Peak bars
  const peaks = [0.3, 0.8, 0.5, 1.0, 0.4, 0.6, 0.9, 0.3, 0.7, 0.5];
  peaks.forEach((v, i) => {
    const x = cx - 50 + (i / (peaks.length - 1)) * 100;
    const h2 = v * 25 * (0.5 + Math.sin(t * 2 + i) * 0.5);
    ctx.fillStyle = `rgba(29,161,232,${0.15 + v * 0.3})`;
    ctx.fillRect(x - 1.5, peakY - h2, 3, h2);
  });
}

function drawReport(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2, cy = h / 2;
  // Certificate page outline
  ctx.strokeStyle = "rgba(16,185,129,0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - 45, cy - 65, 90, 130, 4);
  ctx.stroke();
  // Header bar
  ctx.fillStyle = "rgba(16,185,129,0.08)";
  ctx.fillRect(cx - 45, cy - 65, 90, 18);
  // Header text lines
  ctx.fillStyle = "rgba(16,185,129,0.35)";
  ctx.fillRect(cx - 30, cy - 60, 60, 2);
  ctx.fillRect(cx - 20, cy - 55, 40, 1.5);
  // Data rows
  for (let i = 0; i < 6; i++) {
    const y = cy - 35 + i * 14;
    const revealProg = Math.max(0, Math.min(1, (Math.sin(t * 0.8) + 1) / 2 * 8 - i));
    ctx.fillStyle = `rgba(16,185,129,${0.1 * revealProg})`;
    ctx.fillRect(cx - 35, y, 70, 8);
    ctx.fillStyle = `rgba(16,185,129,${0.3 * revealProg})`;
    ctx.fillRect(cx - 35, y + 1, 25, 2);
    ctx.fillStyle = `rgba(16,185,129,${0.2 * revealProg})`;
    ctx.fillRect(cx + 5, y + 1, 30, 2);
  }
  // ISO seal
  const sealAlpha = 0.15 + Math.sin(t * 1.5) * 0.1;
  ctx.strokeStyle = `rgba(16,185,129,${sealAlpha})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx + 25, cy + 48, 10, 0, Math.PI * 2);
  ctx.stroke();
  // Checkmark in seal
  ctx.strokeStyle = `rgba(16,185,129,${sealAlpha + 0.15})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + 21, cy + 48);
  ctx.lineTo(cx + 24, cy + 52);
  ctx.lineTo(cx + 30, cy + 44);
  ctx.stroke();
}

const DRAW_FUNCTIONS = [
  drawIntake, drawVerification, drawDrying, drawCrushing,
  drawSplitting, drawPulverizing, drawAnalysis, drawReport,
];

// ─── Main Component ────────────────────────────────────────────────────────
export default function GeologicalWorkflowStorytelling() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const rawStep = useTransform(scrollYProgress, [0, 1], [0, WORKFLOW_STEPS.length - 0.01]);

  useMotionValueEvent(rawStep, "change", (v) => {
    setActiveStep(Math.floor(Math.max(0, Math.min(WORKFLOW_STEPS.length - 1, v))));
  });

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.resetTransform();
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Draw faint grid
      ctx.strokeStyle = "rgba(29,161,232,0.04)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw active step visualization
      const drawFn = DRAW_FUNCTIONS[activeStep];
      if (drawFn) {
        drawFn(ctx, w, h, t);
      }

      animRef.current = requestAnimationFrame(render);
    };
    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [activeStep]);

  const currentStep = WORKFLOW_STEPS[activeStep];

  return (
    <section
      ref={containerRef}
      className="relative bg-background"
      style={{ height: `${WORKFLOW_STEPS.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 gradient-mesh opacity-20 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 h-full flex flex-col">
          {/* Section header */}
          <div className="pt-16 pb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary font-mono">Laboratory Workflow</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display">
              From Field to Report
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
              Watch how a geological specimen transforms through every stage of the analytical pipeline.
            </p>
          </div>

          {/* Main content area */}
          <div className="flex-1 grid lg:grid-cols-12 gap-8 items-center min-h-0">
            {/* Left: Canvas visualization */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="relative w-full max-w-[320px] aspect-square">
                {/* Outer glow ring */}
                <div
                  className="absolute -inset-6 rounded-full pointer-events-none transition-all duration-700"
                  style={{
                    background: `radial-gradient(circle, ${currentStep.color}08 0%, transparent 70%)`,
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="w-full h-full rounded-2xl"
                  style={{
                    border: `1px solid ${currentStep.color}15`,
                  }}
                />
                {/* Step counter overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: currentStep.color,
                      background: `${currentStep.color}10`,
                      border: `1px solid ${currentStep.color}20`,
                    }}
                  >
                    STEP {activeStep + 1}/{WORKFLOW_STEPS.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Step info + HUD */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Active step detail card */}
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid size-10 place-items-center rounded-lg transition-colors duration-500"
                    style={{
                      background: `${currentStep.color}12`,
                      color: currentStep.color,
                    }}
                  >
                    <currentStep.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-foreground font-display leading-none">
                      {currentStep.title}
                    </h3>
                    <p
                      className="text-[10px] font-mono font-bold uppercase tracking-widest mt-0.5"
                      style={{ color: currentStep.color }}
                    >
                      {currentStep.subtitle}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                  {currentStep.description}
                </p>

                {/* HUD readouts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {currentStep.hud.map((h, i) => (
                    <motion.div
                      key={`${activeStep}-${i}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                      className="rounded-lg border bg-card/50 backdrop-blur-sm p-2.5"
                      style={{ borderColor: `${currentStep.color}15` }}
                    >
                      <div className="text-[8px] font-mono font-bold tracking-wider text-muted-foreground mb-1">
                        {h.label}
                      </div>
                      <div
                        className="text-sm font-black font-display leading-none"
                        style={{ color: currentStep.color }}
                      >
                        {h.value}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Step navigation dots */}
              <div className="flex items-center gap-2 pt-2">
                {WORKFLOW_STEPS.map((step, i) => {
                  const isActive = i === activeStep;
                  const isPast = i < activeStep;
                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="relative flex items-center justify-center transition-all duration-500"
                        style={{
                          width: isActive ? 32 : 8,
                          height: 8,
                          borderRadius: 4,
                          background: isActive
                            ? step.color
                            : isPast
                              ? `${step.color}50`
                              : "rgba(148,163,184,0.2)",
                        }}
                      />
                    </div>
                  );
                })}
                <span className="ml-2 text-[10px] font-mono text-muted-foreground">
                  {activeStep + 1} of {WORKFLOW_STEPS.length}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom scroll hint */}
          <div className="pb-6 flex justify-center">
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-[10px] font-mono text-muted-foreground/50 flex flex-col items-center gap-1"
            >
              <span>Scroll to explore</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
