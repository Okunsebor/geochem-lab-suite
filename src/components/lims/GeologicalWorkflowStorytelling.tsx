import React, { useRef, useEffect, useState } from "react";
import {
  ScanBarcode, Workflow, Beaker, ShieldCheck,
  CheckCircle2, ArrowRight, Play, RefreshCw, BarChart2
} from "lucide-react";

// ─── Component 1: Intake & Registration Canvas ──────────────────────────────
function IntakeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

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
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Light background grid
      ctx.strokeStyle = "rgba(29, 161, 232, 0.04)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw specimen core box
      ctx.strokeStyle = "rgba(226, 232, 240, 1)";
      ctx.fillStyle = "rgba(248, 250, 252, 0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 50, cy - 60, 100, 120, 6);
      ctx.fill();
      ctx.stroke();

      // Specimen internal content layers (representing rock strata)
      for (let i = 0; i < 4; i++) {
        const y = cy - 40 + i * 24;
        ctx.strokeStyle = "rgba(203, 213, 225, 0.4)";
        ctx.fillStyle = `rgba(148, 163, 184, ${0.08 + i * 0.04})`;
        ctx.beginPath();
        ctx.roundRect(cx - 42, y, 84, 18, 3);
        ctx.fill();
        ctx.stroke();
      }

      // Dynamic QR Grid pattern scanning overlay
      const scanY = cy - 60 + ((Math.sin(t * 1.5) + 1) / 2) * 120;
      ctx.strokeStyle = "rgba(29, 161, 232, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#1DA1E8";
      ctx.beginPath();
      ctx.moveTo(cx - 58, scanY);
      ctx.lineTo(cx + 58, scanY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Outer laser boundary markers
      ctx.strokeStyle = "rgba(29, 161, 232, 0.3)";
      ctx.lineWidth = 1;
      const brackets = [
        [-62, -70], [62, -70],
        [-62, 70], [62, 70]
      ];
      brackets.forEach(([bx, by]) => {
        const x = cx + bx;
        const y = cy + by;
        const dx = bx > 0 ? -8 : 8;
        const dy = by > 0 ? -8 : 8;
        ctx.beginPath();
        ctx.moveTo(x + dx, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy);
        ctx.stroke();
      });

      // Target lock pulsing indicator
      const scale = 1 + Math.sin(t * 4) * 0.15;
      ctx.fillStyle = "rgba(29, 161, 232, 0.7)";
      ctx.beginPath();
      ctx.arc(cx, cy - 70, 3 * scale, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(render);
    };
    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// ─── Component 2: Preparation Canvas (Rock crushing & division) ────────────
function PreparationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

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

    // Physics fragments
    const numFrags = 16;
    const frags = Array.from({ length: numFrags }).map((_, i) => {
      const seed = i * 113.7;
      return {
        ox: Math.sin(seed) * 25,
        size: 3 + (i % 4) * 1.5,
        speed: 0.6 + (i % 3) * 0.4,
        phase: (i * 0.25) % Math.PI
      };
    });

    const render = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Light background grid
      ctx.strokeStyle = "rgba(244, 196, 48, 0.03)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 1. Crushing Jaws
      ctx.strokeStyle = "rgba(203, 213, 225, 1)";
      ctx.lineWidth = 2;
      const jawGap = 15 + Math.sin(t * 3.5) * 6;
      
      // Left Jaw
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy - 50);
      ctx.lineTo(cx - jawGap, cy - 10);
      ctx.lineTo(cx - 45, cy + 30);
      ctx.stroke();

      // Right Jaw
      ctx.beginPath();
      ctx.moveTo(cx + 50, cy - 50);
      ctx.lineTo(cx + jawGap, cy - 10);
      ctx.lineTo(cx + 45, cy + 30);
      ctx.stroke();

      // 2. Falling Ore fragments
      frags.forEach((frag, idx) => {
        const fallPhase = (t * frag.speed + frag.phase) % 3;
        const progress = fallPhase / 3;
        
        let fx = cx + frag.ox;
        let fy = cy - 60 + progress * 110;

        // Apply deviation path inside jaw area
        if (fy > cy - 20 && fy < cy + 20) {
          // squished path
          const side = frag.ox > 0 ? 1 : -1;
          fx = cx + side * Math.min(Math.abs(frag.ox), jawGap - 2);
        } else if (fy >= cy + 20) {
          // split pathway flow
          const side = idx % 2 === 0 ? -1 : 1;
          const splitProgress = (fy - (cy + 20)) / 30;
          fx = cx + side * (12 + splitProgress * 20);
        }

        const size = frag.size;
        const alpha = progress < 0.2 ? progress / 0.2 : (1 - progress) / 0.2 > 0 ? Math.min(1, (1 - progress) / 0.2) : 0;

        ctx.fillStyle = `rgba(148, 163, 184, ${alpha * 0.75})`;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(t * 1.5 + idx);
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();
      });

      // Splitter funnel outline below jaws
      ctx.strokeStyle = "rgba(226, 232, 240, 0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy + 25);
      ctx.lineTo(cx, cy + 35);
      ctx.lineTo(cx + 20, cy + 25);
      ctx.stroke();

      // Funnel divider channels
      ctx.beginPath();
      ctx.moveTo(cx, cy + 35);
      ctx.lineTo(cx, cy + 50);
      ctx.stroke();

      animRef.current = requestAnimationFrame(render);
    };
    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// ─── Component 3: Analysis Canvas (Atomic orbitals & spectral readout) ─────
function AnalysisCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

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
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Light background grid
      ctx.strokeStyle = "rgba(29, 161, 232, 0.04)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Nucleus
      ctx.fillStyle = "rgba(29, 161, 232, 0.25)";
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 6, 0, Math.PI * 2);
      ctx.fill();

      // Electron orbits
      for (let i = 0; i < 3; i++) {
        const rot = (i / 3) * Math.PI;
        ctx.save();
        ctx.translate(cx, cy - 15);
        ctx.rotate(rot);

        // Orbit ellipse
        ctx.strokeStyle = "rgba(29, 161, 232, 0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 42, 16, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Orbiting electron
        const eAngle = t * (1.6 + i * 0.4);
        const ex = Math.cos(eAngle) * 42;
        const ey = Math.sin(eAngle) * 16;
        ctx.fillStyle = "rgba(29, 161, 232, 0.85)";
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Spectroscopy grid chart below
      const chartY = cy + 45;
      ctx.strokeStyle = "rgba(226, 232, 240, 0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 50, chartY);
      ctx.lineTo(cx + 50, chartY);
      ctx.stroke();

      // Chart peaks
      const peaks = [0.25, 0.7, 0.45, 0.95, 0.35, 0.6, 0.8, 0.2, 0.55];
      ctx.strokeStyle = "rgba(29, 161, 232, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      peaks.forEach((val, idx) => {
        const px = cx - 44 + (idx / (peaks.length - 1)) * 88;
        const factor = 0.6 + Math.sin(t * 2.5 + idx * 1.5) * 0.4;
        const py = chartY - val * 22 * factor;
        if (idx === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();

      animRef.current = requestAnimationFrame(render);
    };
    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// ─── Component 4: Reporting Canvas (Certificate form check list) ────────────
function ReportingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

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
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Light background grid
      ctx.strokeStyle = "rgba(16, 185, 129, 0.03)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Certificate background board
      ctx.strokeStyle = "rgba(226, 232, 240, 1)";
      ctx.fillStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 50, cy - 60, 100, 120, 4);
      ctx.fill();
      ctx.stroke();

      // Title bar indicator
      ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
      ctx.fillRect(cx - 50, cy - 60, 100, 20);
      
      ctx.fillStyle = "rgba(16, 185, 129, 0.5)";
      ctx.fillRect(cx - 36, cy - 52, 72, 3);

      // Form line checklist rows fading-in
      for (let i = 0; i < 5; i++) {
        const rowY = cy - 30 + i * 16;
        const revealPhase = Math.max(0, Math.min(1, (Math.sin(t * 1.2) + 1) / 2 * 6 - i));
        
        ctx.fillStyle = `rgba(226, 232, 240, ${revealPhase})`;
        ctx.fillRect(cx - 40, rowY, 80, 8);

        ctx.fillStyle = `rgba(16, 185, 129, ${revealPhase * 0.4})`;
        ctx.fillRect(cx - 40, rowY + 3, 24, 2);

        ctx.fillStyle = `rgba(148, 163, 184, ${revealPhase * 0.3})`;
        ctx.fillRect(cx - 8, rowY + 3, 30, 2);
      }

      // Glowing Certified Badge Stamp
      const stampAlpha = 0.2 + Math.abs(Math.sin(t * 1.8)) * 0.6;
      ctx.strokeStyle = `rgba(16, 185, 129, ${stampAlpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx + 25, cy + 32, 12, 0, Math.PI * 2);
      ctx.stroke();

      // Checkmark inside Stamp
      ctx.strokeStyle = `rgba(16, 185, 129, ${stampAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + 20, cy + 32);
      ctx.lineTo(cx + 24, cy + 36);
      ctx.lineTo(cx + 31, cy + 28);
      ctx.stroke();

      animRef.current = requestAnimationFrame(render);
    };
    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// ─── Data: 4 Cards Setup ────────────────────────────────────────────────────
interface FeatureCard {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  descriptions: string[];
  buttonText: string;
  tag: string;
  tabLabel: string;
  canvas: React.ReactNode;
  hudItems: { label: string; value: string; color: string }[];
}

const CARDS_DATA: FeatureCard[] = [
  {
    id: "intake",
    icon: ScanBarcode,
    title: "Digitize sample custody and eliminate intake errors",
    descriptions: [
      "Register core samples, soil bags, and pulp specimens instantly with dynamic barcode and QR code generation.",
      "Track physical shelf locations, container types, and initial weight readings under a secure chain of custody.",
      "Sync specimen details automatically with downstream analytical systems."
    ],
    buttonText: "Explore Intake System",
    tag: "Registered",
    tabLabel: "Sample Custody Registry",
    canvas: <IntakeCanvas />,
    hudItems: [
      { label: "SAMPLE ID", value: "GCS-24012", color: "text-[#1DA1E8]" },
      { label: "WEIGHT", value: "1.42 kg", color: "text-[#1DA1E8]" },
      { label: "STATUS", value: "VERIFIED", color: "text-emerald-600" }
    ]
  },
  {
    id: "preparation",
    icon: Workflow,
    title: "Standardize preparation stages for assay consistency",
    descriptions: [
      "Govern oven drying temperatures and track moisture loss automatically to reach stable analysis mass.",
      "Control jaw crushers, splitting riffles, and ring pulverizers with standardized operational procedures.",
      "Ensure high sample homogeneity and elemental liberation for subsequent chemical assaying."
    ],
    buttonText: "Manage Preparation Workflows",
    tag: "In Prep",
    tabLabel: "Preparation Workflow SOP",
    canvas: <PreparationCanvas />,
    hudItems: [
      { label: "DRY TEMP", value: "105°C", color: "text-amber-500" },
      { label: "CRUSHING", value: "< 2.0 mm", color: "text-slate-600" },
      { label: "YIELD", value: "99.2%", color: "text-[#1DA1E8]" }
    ]
  },
  {
    id: "analysis",
    icon: Beaker,
    title: "Automate instrument queues and raw data capture",
    descriptions: [
      "Queue samples directly to ICP-MS, AAS, and XRF instruments from automated laboratory schedules.",
      "Import raw analyzer data feeds directly to eliminate manual data entry transcription errors.",
      "Track QA/QC control standards alongside regular samples for real-time verification."
    ],
    buttonText: "Connect Laboratory Instruments",
    tag: "Analyzing",
    tabLabel: "ICP-MS Instrument Queue",
    canvas: <AnalysisCanvas />,
    hudItems: [
      { label: "INSTRUMENT", value: "ICP-MS-01", color: "text-[#1DA1E8]" },
      { label: "Au ASSAY", value: "2.45 g/t", color: "text-amber-600" },
      { label: "Cu RATIO", value: "0.85%", color: "text-indigo-600" }
    ]
  },
  {
    id: "reporting",
    icon: ShieldCheck,
    title: "Publish certified reports with instant compliance",
    descriptions: [
      "Evaluate duplicate variance, blank contamination, and certified reference materials (CRMs) dynamically.",
      "Compile multi-element assay certificates automatically with double-signoff verification.",
      "Deliver secure client portals and ISO-compliant PDF certificates with compliance tracking."
    ],
    buttonText: "Verify Analytical QA/QC",
    tag: "Certified",
    tabLabel: "Analytical Certificate - RPT-2041",
    canvas: <ReportingCanvas />,
    hudItems: [
      { label: "REPORT ID", value: "RPT-2041", color: "text-slate-800" },
      { label: "STANDARD", value: "ISO 17025", color: "text-[#1DA1E8]" },
      { label: "SEAL", value: "LOCKED", color: "text-emerald-600" }
    ]
  }
];

export default function GeologicalWorkflowStorytelling() {
  return (
    <section className="bg-background py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 space-y-28">
        
        {/* Section Header */}
        <div className="max-w-3xl text-center mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-bold font-mono tracking-widest text-primary uppercase">
            Product Features
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display">
            A secure foundation from field to final certificate
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Eliminate manual tracking worksheets and standardize physical workflows with our integrated laboratory operations modules.
          </p>
        </div>

        {/* Feature Cards Column List */}
        <div className="space-y-28">
          {CARDS_DATA.map((card, index) => {
            const Icon = card.icon;
            
            return (
              <div 
                key={card.id} 
                className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center"
              >
                
                {/* Text Side (Left column) */}
                <div className="lg:col-span-5 flex flex-col space-y-6 order-2 lg:order-1">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-primary/8 text-primary shadow-sm">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                      {card.id.toUpperCase()} MODULE
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display leading-[1.15]">
                    {card.title}
                  </h3>

                  <div className="space-y-4">
                    {card.descriptions.map((desc, i) => (
                      <p 
                        key={i} 
                        className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                      >
                        {desc}
                      </p>
                    ))}
                  </div>

                  <div>
                    <button className="inline-flex items-center gap-2 rounded-lg bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-3 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 font-display">
                      {card.buttonText} <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Benchling visual wrapper card Side (Right column) */}
                <div className="lg:col-span-7 order-1 lg:order-2">
                  <div className="bg-[#e8f2ff] dark:bg-[#0c192c] p-6 sm:p-8 md:p-10 rounded-[2rem] border border-[#d6e7ff] dark:border-[#1e3456] shadow-sm">
                    
                    {/* Inner Mockup Card Container */}
                    <div className="bg-white dark:bg-[#07111c] border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] aspect-[4/3] relative overflow-hidden flex flex-col justify-between">
                      
                      {/* Top Bar of the Mockup */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-bold ml-2">
                            {card.tabLabel}
                          </span>
                        </div>
                        
                        {/* Dynamic Status Tag pill */}
                        <div className="flex items-center gap-1.5 bg-[#eaf7ee] text-[#10b881] dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          {card.tag}
                        </div>
                      </div>

                      {/* Middle Area: The continuous canvas loop animation */}
                      <div className="flex-1 min-h-0 relative my-3 flex items-center justify-center">
                        {card.canvas}
                      </div>

                      {/* Bottom Area: Dynamic telemetry readout panel */}
                      <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 bg-slate-50/50 dark:bg-[#091523]/50 rounded-lg p-2.5">
                        {card.hudItems.map((hud, i) => (
                          <div key={i} className="flex flex-col">
                            <span className="text-[8px] font-mono font-bold tracking-wider text-slate-400">
                              {hud.label}
                            </span>
                            <span className={`text-xs font-black font-mono mt-0.5 ${hud.color}`}>
                              {hud.value}
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
