import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, ShieldCheck, Workflow, BarChart3, ScanBarcode,
  ArrowRight, CheckCircle2, Beaker, Building2, Cpu, Activity,
  TrendingUp, AlertTriangle, Clock, Layers
} from "lucide-react";
import GeologicalWorkflowStorytelling from "../components/lims/GeologicalWorkflowStorytelling";
import unipodLab from "../assets/unipod-lab.jpg";
import unipodFacade from "../assets/unipod-facade.jpg";
import unipodEvent from "../assets/unipod-event.png";

export const Route = createFileRoute("/")(({
  component: Landing,
  head: () => ({
    meta: [
      { title: "GeoChem Suite — Enterprise LIMS for Modern Labs" },
      { name: "description", content: "GeoChem Suite is a modern Laboratory Information Management System for geochemical analysis — sample intake to report delivery in one workflow." },
    ],
  }),
}) as any);

// ─── Typewriter Subheading ─────────────────────────────────────────────────
const TYPEWRITER_PHRASES = [
  "digitizes laboratory workflows from intake to analytical reporting.",
  "eliminates manual custody errors and duplicate assay miscalculations.",
  "ensures ISO 17025 compliance with real-time QA/QC anomaly detection.",
  "automates instrument queues, preparation tracking, and report dispatch.",
];

function TypewriterSubheading() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const cursorTimer = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(cursorTimer);
  }, []);

  useEffect(() => {
    const phrase = TYPEWRITER_PHRASES[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!isDeleting && displayed.length < phrase.length) {
      timeout = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 38);
    } else if (!isDeleting && displayed.length === phrase.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2800);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 18);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setPhraseIdx(i => (i + 1) % TYPEWRITER_PHRASES.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, phraseIdx]);

  return (
    <span className="text-muted-foreground">
      GeoChem Suite{" "}
      <span className="text-foreground/90">{displayed}</span>
      <span
        className="inline-block w-[2px] h-[1.1em] bg-accent ml-[1px] align-middle"
        style={{ opacity: cursorVisible ? 1 : 0, transition: "opacity 0.1s" }}
      />
    </span>
  );
}

// ─── Workspace 3D Showcase ─────────────────────────────────────────────────
const WORKSPACE_TABS = [
  { id: "dashboard", label: "Dashboard", path: "/workspace/dashboard" },
  { id: "samples", label: "Samples", path: "/workspace/samples" },
  { id: "intake", label: "Sample Intake", path: "/workspace/intake" },
  { id: "analysis", label: "Analysis", path: "/workspace/analysis" },
  { id: "qaqc", label: "QA / QC", path: "/workspace/qa-qc" },
];

// Mini SVG line chart
function MiniLineChart({ color = "#1DA1E8", data }: { color?: string; data: number[] }) {
  const W = 320, H = 80;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * (H - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  const areaBottom = `${W},${H} 0,${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline points={`${pts} ${areaBottom}`} fill={`url(#fill-${color.replace("#", "")})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Mini donut chart
function MiniDonut({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let angle = -Math.PI / 2;
  const R = 40, cx = 50, cy = 50, stroke = 14;
  const arcs = segments.map(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
    angle += sweep;
    const x2 = cx + R * Math.cos(angle), y2 = cy + R * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { d: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`, color: seg.color };
  });
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      {arcs.map((a, i) => (
        <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={stroke} strokeLinecap="butt" />
      ))}
      <circle cx={cx} cy={cy} r={R - stroke / 2 - 1} fill="#f8fafc" />
    </svg>
  );
}

// Dashboard view
function DashboardView() {
  const throughputData = [14, 13, 15, 16, 14, 12, 15, 17, 13, 14, 16, 15, 12, 10, 14, 13, 15, 16, 14];
  const completedData = [12, 11, 13, 14, 12, 10, 13, 14, 12, 12, 14, 13, 10, 8, 12, 11, 13, 15, 13];
  return (
    <div className="flex flex-col gap-3 text-[11px]">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "ACTIVE SAMPLES", val: "12", delta: "+3", pos: true, icon: <Activity className="size-3 text-primary" /> },
          { label: "AVG. TURNAROUND", val: "3.2d", delta: "-0.4d", pos: true, icon: <Clock className="size-3 text-primary" /> },
          { label: "QA/QC PASS RATE", val: "98.6%", delta: "+0.8%", pos: true, icon: <ShieldCheck className="size-3 text-primary" /> },
          { label: "OVERDUE", val: "2", delta: "-1", pos: true, icon: <AlertTriangle className="size-3 text-amber-400" /> },
        ].map(k => (
          <div key={k.label} className="rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex items-center justify-between mb-1.5">{k.icon}<span className="text-[8px] font-mono text-slate-400 tracking-wider">{k.label}</span></div>
            <div className="text-lg font-black text-slate-800 font-display leading-none">{k.val}</div>
            <div className={`text-[8px] font-bold mt-1 font-mono ${k.pos ? "text-emerald-500" : "text-red-500"}`}>{k.delta} vs last 14d</div>
          </div>
        ))}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-bold text-slate-700 text-[10px]">Throughput</div>
              <div className="text-[8px] text-slate-400 font-mono">Samples received vs completed · 14 days</div>
            </div>
            <div className="flex gap-1">
              {["14d", "30d", "90d"].map(t => (
                <span key={t} className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${t === "14d" ? "bg-primary text-white" : "text-slate-400"}`}>{t}</span>
              ))}
            </div>
          </div>
          <div className="relative">
            <MiniLineChart color="#1DA1E8" data={throughputData} />
            <div className="absolute top-0 left-0 w-full">
              <MiniLineChart color="#10b981" data={completedData} />
            </div>
          </div>
        </div>
        <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-3 flex flex-col items-center">
          <div className="font-bold text-slate-700 text-[10px] self-start mb-1">Workflow Split</div>
          <div className="text-[8px] text-slate-400 font-mono self-start mb-2">Samples by stage</div>
          <MiniDonut segments={[
            { value: 35, color: "#1DA1E8" },
            { value: 28, color: "#10b981" },
            { value: 22, color: "#F4C430" },
            { value: 15, color: "#ef4444" },
          ]} />
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1.5">
            {[["#1DA1E8", "Preparation"], ["#10b981", "Analysis"], ["#F4C430", "QA/QC"], ["#ef4444", "Reporting"]].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1">
                <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: c }} />
                <span className="text-[8px] text-slate-500 font-mono">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Samples view
function SamplesView() {
  const rows = [
    { id: "GCS-24012", client: "Auric Mining Ltd", project: "Drillhole AX-204", type: "Drill Core", pri: "High", tech: "J. Nakamura", storage: "Rack A-1", status: "In Analysis", sc: "text-primary", bc: "bg-primary/10 text-primary border-primary/30" },
    { id: "GCS-24011", client: "Atlas Minerals", project: "Pit Sample BX-11", type: "Soil", pri: "Normal", tech: "M. Rivera", storage: "Rack B-3", status: "Preparation", sc: "text-amber-400", bc: "bg-amber-400/10 text-amber-400 border-amber-400/30" },
    { id: "GCS-24010", client: "Terra Core Ltd", project: "Core Log CX-07", type: "Rock Chip", pri: "Rush", tech: "S. Patel", storage: "Rack C-2", status: "QA Flagged", sc: "text-red-400", bc: "bg-red-400/10 text-red-400 border-red-400/30" },
    { id: "GCS-24009", client: "Ore Track Inc", project: "Survey DX-03", type: "Stream Sed.", pri: "Low", tech: "E. Okafor", storage: "Rack A-5", status: "Report Ready", sc: "text-emerald-400", bc: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30" },
  ];
  return (
    <div className="flex flex-col gap-3 text-[10px]">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-400 font-mono text-[9px] flex items-center gap-1.5">
          <span>🔍</span> Search by ID, client or project...
        </div>
        <span className="text-[9px] text-slate-500 border border-slate-200 rounded px-2 py-1.5 font-mono bg-white">All Statuses ▾</span>
        <span className="text-[9px] text-slate-500 border border-slate-200 rounded px-2 py-1.5 font-mono bg-white">⚡ Scan</span>
      </div>
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-8 gap-1 bg-slate-50 px-3 py-2 text-[8px] text-slate-400 font-mono font-bold tracking-wider border-b border-slate-100">
          <span className="col-span-1">SAMPLE ID</span>
          <span className="col-span-1">CLIENT</span>
          <span className="col-span-1">PROJECT</span>
          <span className="col-span-1">TYPE</span>
          <span className="col-span-1">PRIORITY</span>
          <span className="col-span-1">TECHNICIAN</span>
          <span className="col-span-1">STORAGE</span>
          <span className="col-span-1">STATUS</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.id} className={`grid grid-cols-8 gap-1 px-3 py-2 items-center border-t border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"} hover:bg-primary/[0.03] transition-colors`}>
            <span className="col-span-1 text-primary font-bold font-mono">{r.id}</span>
            <span className="col-span-1 text-slate-700 truncate">{r.client}</span>
            <span className="col-span-1 text-slate-500 truncate font-mono">{r.project}</span>
            <span className="col-span-1 text-slate-500">{r.type}</span>
            <span className="col-span-1"><span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${r.bc}`}>{r.pri}</span></span>
            <span className="col-span-1 text-slate-500">{r.tech}</span>
            <span className="col-span-1 text-slate-400 font-mono">{r.storage}</span>
            <span className={`col-span-1 text-[8px] font-bold ${r.sc}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Intake view
function IntakeView() {
  return (
    <div className="grid grid-cols-5 gap-3 text-[10px]">
      <div className="col-span-3 rounded-lg border border-slate-200 bg-white p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Client", "Auric Mining Ltd"],
            ["Project", "Drillhole AX-204"],
            ["Sample Type", "Drill Core"],
            ["Matrix", "Sulphide"],
            ["Sample Weight (kg)", "1.42"],
            ["Container", "Calico Bag"],
            ["Received From", "Field Tech A. Vargas"],
            ["Date Received", "05/29/2026"],
          ].map(([label, val]) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-[8px] text-slate-400 font-mono">{label}</label>
              <div className="border border-slate-200 bg-slate-50 rounded px-2 py-1.5 text-slate-700 font-mono text-[9px]">{val}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[8px] text-slate-400 font-mono">Priority Level</label>
          <div className="flex gap-1.5">
            {["Low", "Normal", "High", "Rush"].map(p => (
              <span key={p} className={`px-3 py-1 rounded text-[9px] font-bold border ${p === "Normal" ? "bg-primary text-white border-primary" : "border-slate-200 text-slate-400 bg-white"}`}>{p}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[8px] text-slate-400 font-mono">Requested Tests</label>
          <div className="flex flex-wrap gap-1.5">
            {[["FA-AAS Au", true], ["Multi-element 4-acid", true], ["Multi-element Aqua Regia", false], ["ICP-MS 51E", false]].map(([t, checked]) => (
              <label key={t as string} className="flex items-center gap-1 cursor-pointer">
                <span className={`size-3 rounded border flex items-center justify-center ${checked ? "bg-primary border-primary" : "border-slate-300 bg-white"}`}>
                  {checked && <span className="text-white text-[7px]">✓</span>}
                </span>
                <span className="text-[8px] text-slate-600">{t as string}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <ScanBarcode className="size-3 text-primary" />
            <span className="text-[9px] font-bold text-slate-700">Quick Scan</span>
          </div>
          <p className="text-[8px] text-slate-400 mb-2">Scan an inbound shipment QR code to auto-fill the form.</p>
          <div className="border border-dashed border-primary/30 rounded p-2 text-center text-[8px] text-primary/60 font-mono">
            <div className="flex justify-center mb-1">
              <div className="size-6 border-2 border-primary/40 rounded relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-primary/60 animate-pulse" />
                </div>
              </div>
            </div>
            Awaiting scanner input...
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="size-3 text-primary" />
            <span className="text-[9px] font-bold text-slate-700">Bulk Import</span>
          </div>
          <p className="text-[8px] text-slate-400 mb-2">CSV with up to 500 samples per batch.</p>
          <div className="border border-dashed border-slate-200 rounded p-2 text-center text-[8px] text-slate-400 font-mono">
            Drop CSV here or <span className="text-primary">browse</span>
          </div>
        </div>
        <button className="w-full rounded-lg bg-primary text-white font-bold text-[9px] py-2 hover:bg-primary/90 transition-colors">
          Register Sample →
        </button>
      </div>
    </div>
  );
}

// Analysis view
function AnalysisView() {
  const runs = [
    { id: "RUN-10001", sample: "GCS-24020", method: "FA-AAS", inst: "ICP-MS-01", analyst: "E. Okafor", status: "Queued", sc: "text-slate-400 border-slate-200 bg-slate-50" },
    { id: "RUN-10002", sample: "GCS-24021", method: "ICP-MS-51E", inst: "XRF-02", analyst: "K. Nakamura", status: "Running", sc: "text-amber-600 border-amber-200 bg-amber-50" },
    { id: "RUN-10003", sample: "GCS-24022", method: "ICP-OES-4A", inst: "AAS-04", analyst: "S. Patel", status: "Complete", sc: "text-emerald-600 border-emerald-200 bg-emerald-50" },
    { id: "RUN-10004", sample: "GCS-24023", method: "LECO-CS", inst: "LECO-05", analyst: "M. Rivera", status: "Queued", sc: "text-slate-400 border-slate-200 bg-slate-50" },
    { id: "RUN-10005", sample: "GCS-24024", method: "AR-ICP-MS", inst: "ICP-MS-01", analyst: "E. Okafor", status: "Running", sc: "text-amber-600 border-amber-200 bg-amber-50" },
  ];
  return (
    <div className="grid grid-cols-5 gap-3 text-[10px]">
      <div className="col-span-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-700 text-[11px]">Active Analysis Queue</span>
          <span className="text-[8px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">8 runs</span>
        </div>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-8 gap-1 bg-slate-50 px-2.5 py-2 text-[8px] text-slate-400 font-mono font-bold border-b border-slate-100">
            <span className="col-span-1">RUN ID</span><span className="col-span-1">SAMPLE</span>
            <span className="col-span-1">METHOD</span><span className="col-span-2">INSTRUMENT</span>
            <span className="col-span-1">ANALYST</span><span className="col-span-2">STATUS</span>
          </div>
          {runs.map((r, i) => (
            <div key={r.id} className={`grid grid-cols-8 gap-1 px-2.5 py-2 border-t border-slate-100 items-center ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
              <span className="col-span-1 font-mono text-slate-400 text-[8px]">{r.id}</span>
              <span className="col-span-1 font-bold text-primary font-mono text-[8px]">{r.sample}</span>
              <span className="col-span-1 text-slate-500 text-[8px]">{r.method}</span>
              <span className="col-span-2 text-slate-500 text-[8px]">{r.inst}</span>
              <span className="col-span-1 text-slate-400 text-[8px]">{r.analyst}</span>
              <span className={`col-span-2 text-[8px] font-bold px-1.5 py-0.5 rounded border ${r.sc}`}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-2">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-700 text-[11px]">Method Library</span>
          <span className="text-[8px] text-slate-400 font-mono">5 methods</span>
        </div>
        <div className="space-y-1.5">
          {[
            { code: "FA-AAS", name: "Fire Assay AAS", desc: "Fire assay with AAS finish for gold determination", elements: "Au", dup: "10%", crm: "±5%" },
            { code: "ICP-MS-51E", name: "51-Element Package", desc: "ICP-MS 51-element trace package", elements: "Ag As Ba Co", dup: "15%", crm: "±5%" },
            { code: "ICP-OES-4A", name: "ICP-OES 4-Acid Digestion", desc: "Major and minor elements via 4-acid digestion", elements: "Ca Fe Al Mg", dup: "10%", crm: "±5%" },
          ].map(m => (
            <div key={m.code} className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Beaker className="size-3 text-primary" />
                <span className="text-[9px] font-bold text-slate-700">{m.code}</span>
              </div>
              <p className="text-[8px] text-slate-400 mb-1">{m.desc}</p>
              <div className="flex gap-1 flex-wrap">
                {m.elements.split(" ").map(el => <span key={el} className="text-[7px] font-bold px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{el}</span>)}
              </div>
              <div className="flex gap-2 mt-1">
                <span className="text-[7px] text-slate-400 font-mono">Dup RPD: {m.dup}</span>
                <span className="text-[7px] text-slate-400 font-mono">CRM Tot: {m.crm}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// QA/QC view
function QAQCView() {
  const crmData = [2.38, 2.42, 2.55, 2.52, 2.48, 2.40, 2.43, 2.50, 2.46, 2.38, 2.42, 2.44, 2.47, 2.41, 2.43, 2.45, 2.39, 2.43, 2.42];
  const cert = 2.400, upper = 2.520, lower = 2.280;
  const W = 280, H = 70;
  const minV = lower - 0.05, maxV = upper + 0.05;
  const toY = (v: number) => H - ((v - minV) / (maxV - minV)) * (H - 4) - 2;
  const toX = (i: number) => (i / (crmData.length - 1)) * W;
  const rpdData = [12.1, 8.4, 11.8, 9.2, 13.4, 7.8, 12.5, 11.0, 4.2, 12.8, 8.1, 13.2, 9.5, 7.0, 12.9, 11.4, 5.8, 13.0, 8.7];
  return (
    <div className="flex flex-col gap-3 text-[10px]">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "PASS RATE", val: "96.4%", sc: "text-emerald-500" },
          { label: "OPEN FLAGS", val: "2", sc: "text-amber-500" },
          { label: "CRMS OUT-OF-SPEC", val: "0", sc: "text-emerald-500" },
          { label: "AVG DUPLICATE SPREAD", val: "10.3%", sc: "text-primary" },
        ].map(k => (
          <div key={k.label} className="rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="text-[7px] font-mono text-slate-400 mb-1 tracking-wider">{k.label}</div>
            <div className={`text-xl font-black font-display ${k.sc}`}>{k.val}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="font-bold text-slate-700 text-[10px] mb-0.5">CRM Trend — OREAS 234 (Au g/t)</div>
          <div className="text-[8px] text-slate-400 mb-2 font-mono">Certified: 2.400 g/t · Tolerance ±5%</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <line x1="0" y1={toY(upper)} x2={W} y2={toY(upper)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1="0" y1={toY(lower)} x2={W} y2={toY(lower)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1="0" y1={toY(cert)} x2={W} y2={toY(cert)} stroke="#10b981" strokeWidth="1" />
            <polyline points={crmData.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")} fill="none" stroke="#1DA1E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="font-bold text-slate-700 text-[10px] mb-0.5">Duplicate RPD Distribution</div>
          <div className="text-[8px] text-slate-400 mb-2 font-mono">Threshold: 10% · 4 over limit</div>
          <svg viewBox="0 0 280 70" className="w-full">
            <line x1="0" y1="28" x2="280" y2="28" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3,3" />
            {rpdData.map((v, i) => {
              const x = (i / (rpdData.length - 1)) * 272 + 4;
              const y = 66 - (v / 16) * 62;
              return <circle key={i} cx={x} cy={y} r="3" fill={v > 10 ? "#ef4444" : "#1DA1E8"} fillOpacity="0.8" />;
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

const VIEW_COMPONENTS: Record<string, React.FC> = {
  dashboard: DashboardView,
  samples: SamplesView,
  intake: IntakeView,
  analysis: AnalysisView,
  qaqc: QAQCView,
};

function Workspace3DShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const progressRef = useRef(0);
  const DURATION = 5000;

  // Auto-carousel with progress bar
  useEffect(() => {
    let start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / DURATION, 1);
      progressRef.current = p;
      setProgress(p);
      if (p >= 1) {
        setActiveTab(t => (t + 1) % WORKSPACE_TABS.length);
        start = performance.now();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Reset progress on manual tab click
  const handleTab = useCallback((i: number) => {
    setActiveTab(i);
    setProgress(0);
  }, []);

  // 3D tilt
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / rect.height) * -8;
    const ry = ((e.clientX - cx) / rect.width) * 8;
    setTilt({ x: rx, y: ry });
  }, []);
  const handleMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  const ActiveView = VIEW_COMPONENTS[WORKSPACE_TABS[activeTab].id];

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ perspective: "1200px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Outer glow */}
      <div className="absolute -inset-8 rounded-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(29,161,232,0.08) 0%, transparent 70%)" }} />

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.15s ease-out",
          transformStyle: "preserve-3d",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(29,161,232,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
          WebkitMaskImage: "radial-gradient(ellipse 95% 95% at center, black 60%, transparent 100%)",
          maskImage: "radial-gradient(ellipse 95% 95% at center, black 60%, transparent 100%)",
        }}
      >
        {/* Browser chrome bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b"
          style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
          <div className="flex gap-1.5 shrink-0">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
          </div>
          {/* URL bar */}
          <div className="flex-1 mx-2 rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-500 text-[8px]">🔒</span>
            <AnimatePresence mode="wait">
              <motion.span key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                lims.geochem-suite.io{WORKSPACE_TABS[activeTab].path}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="flex gap-0.5 shrink-0">
            {WORKSPACE_TABS.map((t, i) => (
              <button key={t.id} onClick={() => handleTab(i)}
                className={`px-2 py-0.5 text-[8px] font-bold rounded font-mono transition-all ${i === activeTab ? "bg-primary text-white" : "text-slate-400 hover:text-slate-600"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-slate-100 relative overflow-hidden">
          <motion.div className="absolute left-0 top-0 h-full bg-primary"
            style={{ width: `${progress * 100}%` }}
            transition={{ ease: "linear" }} />
        </div>

        {/* Sidebar + content area */}
        <div className="flex" style={{ background: "#ffffff", minHeight: 340 }}>
          {/* Sidebar */}
          <div className="w-32 shrink-0 border-r border-slate-200 pt-3" style={{ background: "#f8fafc" }}>
            <div className="flex items-center gap-1.5 px-3 mb-3">
              <div className="size-5 rounded grid place-items-center bg-primary shrink-0">
                <FlaskConical className="size-3 text-white" />
              </div>
              <div>
                <div className="text-[9px] font-black text-slate-800 leading-none">GeoChem Suite</div>
                <div className="text-[7px] text-slate-400 font-mono">LIMS · v0.9</div>
              </div>
            </div>
            <div className="px-2 space-y-0.5">
              <div className="text-[7px] text-slate-400 font-mono font-bold uppercase tracking-widest px-2 pt-2 pb-1">Workspace</div>
              {[
                { label: "Dashboard", icon: <BarChart3 className="size-3" />, key: "dashboard" },
                { label: "Samples", icon: <Beaker className="size-3" />, key: "samples" },
                { label: "Sample Intake", icon: <ScanBarcode className="size-3" />, key: "intake" },
                { label: "Preparation", icon: <Workflow className="size-3" />, key: null },
                { label: "Analysis", icon: <Activity className="size-3" />, key: "analysis" },
                { label: "QA / QC", icon: <ShieldCheck className="size-3" />, key: "qaqc" },
                { label: "Reports", icon: <TrendingUp className="size-3" />, key: null },
              ].map(item => {
                const isActive = item.key === WORKSPACE_TABS[activeTab].id;
                return (
                  <div key={item.label}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[9px] font-medium transition-all cursor-default ${isActive ? "bg-primary/10 text-primary font-bold" : "text-slate-400 hover:text-slate-600"}`}>
                    {item.icon}<span>{item.label}</span>
                  </div>
                );
              })}
              <div className="text-[7px] text-slate-400 font-mono font-bold uppercase tracking-widest px-2 pt-3 pb-1">Operations</div>
              {[["Instruments", ""], ["Storage", ""], ["Activity Logs", ""], ["Analytics", ""]].map(([l]) => (
                <div key={l} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[9px] text-slate-400 hover:text-slate-600 cursor-default">{l}</div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Page header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[8px] text-slate-400 font-mono mb-0.5">
                  Workspace / <span className="text-primary">{WORKSPACE_TABS[activeTab].label}</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.h2 key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }} className="text-sm font-black text-slate-800 font-display leading-none">
                    {WORKSPACE_TABS[activeTab].label === "Dashboard" ? "Operational Dashboard"
                      : WORKSPACE_TABS[activeTab].label === "Samples" ? "Sample Registry"
                        : WORKSPACE_TABS[activeTab].label === "Sample Intake" ? "Sample Intake"
                          : WORKSPACE_TABS[activeTab].label === "Analysis" ? "Analysis"
                            : "QA / QC Monitoring"}
                  </motion.h2>
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold text-slate-500 border border-slate-200 rounded px-2 py-1 font-mono bg-white">+ New intake</span>
                <span className="text-[8px] font-bold text-white bg-primary rounded px-2 py-1">Approve reports</span>
              </div>
            </div>

            {/* Dynamic view */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: "easeInOut" }}>
                <ActiveView />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Reflection sheen overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 50%)" }} />
      </div>
    </div>
  );
}

// ─── Animation variants ─────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.06 } }
} as any;
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 88, damping: 14 } }
} as any;

// ─── Landing Page ───────────────────────────────────────────────────────────
function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="grid size-8 place-items-center rounded-md gradient-primary text-white transition-transform group-hover:scale-105 group-hover:rotate-6">
              <FlaskConical className="size-4" />
            </div>
            <span className="font-semibold tracking-tight transition-colors group-hover:text-primary">GeoChem Suite</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            {["Platform", "Modules", "Analytics", "Security"].map(n => (
              <a key={n} href={`#${n.toLowerCase()}`}
                className="hover:text-foreground transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">{n}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Sign in</Link>
            <Link to="/app" className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-95 transition-all hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5">
              Launch app <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/20 bg-background min-h-[calc(100vh-64px)] flex items-center">

        {/* UniPod facade image as architectural backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <img src={unipodFacade} alt="UniPod facility — Nasarawa State University, Keffi"
            className="absolute inset-0 w-full h-full object-cover opacity-[0.13]" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
        </div>

        {/* Gradient mesh */}
        <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
        <div className="absolute inset-0 grid-pattern opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 w-full grid lg:grid-cols-12 gap-10 items-center">

          {/* LEFT column */}
          <motion.div className="lg:col-span-5 flex flex-col space-y-7" variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white px-3 py-1.5 text-[10px] font-bold font-mono tracking-widest text-primary uppercase shadow-sm">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                UniPod · MineTech
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[10px] font-bold font-mono tracking-widest text-[#8a6912] uppercase">
                UNDP Supported
              </span>
            </motion.div>

            <motion.h1 variants={item}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl text-foreground leading-[1.05] font-display">
              Nigeria&apos;s Geochemistry{" "}
              <span className="text-gradient font-black">Intelligence Platform</span>
            </motion.h1>

            <motion.p variants={item} className="text-base sm:text-lg leading-relaxed font-sans min-h-[3.5rem]">
              <TypewriterSubheading />
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap gap-3">
              <Link to="/app"
                className="inline-flex items-center gap-2 rounded-lg gradient-primary px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all hover:-translate-y-0.5 font-display">
                Launch Platform <ArrowRight className="size-4" />
              </Link>
              <Link to="/portal"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/80 backdrop-blur-md px-7 py-4 text-sm font-semibold hover:bg-muted text-foreground transition-all hover:-translate-y-0.5 font-display">
                Customer Portal
              </Link>
            </motion.div>

            <motion.div variants={item}
              className="grid grid-cols-3 gap-5 border-t border-border/40 pt-6 text-[10px] font-bold font-mono uppercase tracking-widest text-muted-foreground">
              {[
                { val: "ISO 17025", label: "Aligned" },
                { val: "< 1.5s", label: "Intake Latency" },
                { val: "MineTech", label: "Nasarawa · Keffi" },
              ].map(s => (
                <div key={s.label}>
                  <span className="text-2xl sm:text-3xl font-black text-foreground block font-display">{s.val}</span>
                  {s.label}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT column — Lab photo + 3D showcase composition */}
          <motion.div className="lg:col-span-7 relative"
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            {/* Floating lab photo card behind showcase */}
            <div className="absolute -top-6 -right-4 w-[58%] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-primary/15 hidden lg:block">
              <img src={unipodLab} alt="UniPod analytical laboratory — instrumentation hall"
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                <div>
                  <div className="text-[9px] font-mono tracking-widest opacity-80">UNIT 04</div>
                  <div className="text-sm font-bold font-display">Analytical Instrumentation Hall</div>
                </div>
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
            <div className="relative lg:mt-32">
              <Workspace3DShowcase />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── INSTITUTIONAL PARTNER BAR ──────────────────────────── */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-x-10 gap-y-3">
          <span className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-muted-foreground">
            An institutional collaboration
          </span>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm font-display font-bold text-foreground/80">
            <span>Government of Nasarawa State</span>
            <span className="text-border">·</span>
            <span>Ministry of Solid Minerals</span>
            <span className="text-border">·</span>
            <span>Nasarawa State University, Keffi</span>
            <span className="text-border">·</span>
            <span className="text-primary">UniPod</span>
            <span className="text-border">·</span>
            <span className="text-primary">UNDP</span>
          </div>
        </div>
      </section>

      {/* ── UNIPOD FACILITY SHOWCASE ───────────────────────────── */}
      <section className="relative border-b border-border bg-gradient-to-b from-white to-secondary/40">
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
              {/* Facade — large left */}
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

              {/* Lab — top right */}
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

              {/* Event poster — bottom right */}
              <motion.div
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
                className="col-span-2 row-span-3 relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-primary/10 group bg-white">
                <img src={unipodEvent} alt="Ideation Workshop / Ecosystem Mixer 2026 — UniPod"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </motion.div>

              {/* Stat strip — bottom left */}
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


      {/* ── MODULES ──────────────────────────────────────────── */}
      <section id="modules" className="border-t border-border bg-card/25">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-3xl text-center mx-auto">
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
              <motion.div key={m.t}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 90, damping: 13 }}
                className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:bg-muted/10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
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

      {/* ── PLATFORM ─────────────────────────────────────────── */}
      <section id="platform" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6 text-left">

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
              ].map((item2, idx) => (
                <motion.div key={item2.title}
                  initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                  className="flex gap-3">
                  <CheckCircle2 className="size-4.5 text-success shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{item2.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item2.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card p-6 shadow-xl relative overflow-hidden group">
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
              ].map(([id, st, who, pct, sc]) => (
                <div key={id}
                  className={`grid grid-cols-12 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold font-mono transition-all duration-300 hover:pl-4 cursor-default ${sc}`}>
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

      {/* ── CTA ──────────────────────────────────────────────── */}
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

      {/* ── FOOTER ───────────────────────────────────────────── */}
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
