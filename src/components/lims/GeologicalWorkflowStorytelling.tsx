import React, { useState, useEffect, useRef } from "react";
import {
  ScanBarcode,
  Workflow,
  Beaker,
  ShieldCheck,
  ArrowRight,
  Play,
  Pause,
  RefreshCw,
  Layers,
  Database,
} from "lucide-react";

import intakeQrImg from "../../../assets/showcase/intake_qr.svg";
import intakeTrackingImg from "../../../assets/showcase/intake_tracking.svg";
import intakeSyncImg from "../../../assets/showcase/intake_sync.svg";
import prepSopImg from "../../../assets/showcase/prep_sop.svg";
import analysisQueueImg from "../../../assets/showcase/analysis_queue.svg";
import reportingCertImg from "../../../assets/showcase/reporting_cert.svg";

export default function GeologicalWorkflowStorytelling() {
  // Card 1: Sub-flow video cycle states
  const [activeCustodyStep, setActiveCustodyStep] = useState(0);
  const [isPlayingCustody, setIsPlayingCustody] = useState(true);
  const [custodyProgress, setCustodyProgress] = useState(0);
  const custodyProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sub-flow list for Custody Module
  const custodySteps = [
    {
      title: "Register specimens with barcodes & QR codes",
      description:
        "Register core samples, soil bags, and pulp specimens instantly with dynamic barcode and QR code generation.",
      image: intakeQrImg,
      hud: [
        { label: "REGISTRY ID", value: "QR-GCS-24012" },
        { label: "SPECIMEN", value: "HQ Core" },
        { label: "GENERATION", value: "SUCCESS" },
      ],
    },
    {
      title: "Track physical shelves & chain of custody",
      description:
        "Track physical shelf locations, container types, and initial weight readings under a secure chain of custody.",
      image: intakeTrackingImg,
      hud: [
        { label: "SHELF LOC", value: "Rack A-1" },
        { label: "CONTAINER", value: "Calico Bag" },
        { label: "MASS", value: "1.42 kg" },
      ],
    },
    {
      title: "Sync details with analytical systems",
      description: "Sync specimen details automatically with downstream analytical systems.",
      image: intakeSyncImg,
      hud: [
        { label: "TARGET PORT", value: "ICP-MS-01" },
        { label: "SYNC STATUS", value: "SYNCHRONIZED" },
        { label: "LATENCY", value: "48ms" },
      ],
    },
  ];

  // Auto-play cycle for Card 1
  useEffect(() => {
    if (!isPlayingCustody) {
      if (custodyProgressInterval.current) clearInterval(custodyProgressInterval.current);
      return;
    }

    custodyProgressInterval.current = setInterval(() => {
      setCustodyProgress((prev) => {
        if (prev >= 100) {
          setActiveCustodyStep((prevStep) => (prevStep + 1) % custodySteps.length);
          return 0;
        }
        return prev + 1.5; // Controls video play speed (roughly 4-5 seconds per step)
      });
    }, 60);

    return () => {
      if (custodyProgressInterval.current) clearInterval(custodyProgressInterval.current);
    };
  }, [isPlayingCustody, activeCustodyStep]);

  const selectCustodyStep = (index: number) => {
    setActiveCustodyStep(index);
    setCustodyProgress(0);
  };

  return (
    <section className="bg-background py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 space-y-28">
        {/* Section Header */}
        <div className="max-w-3xl text-center mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-bold font-mono tracking-widest text-primary uppercase">
            Interactive Product Features
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display">
            A secure foundation from field to final certificate
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Eliminate manual tracking sheets and standardize laboratory workflows. Watch these live
            features demonstrate how GeoChem Suite handles custody, prep, analysis, and reporting.
          </p>
        </div>

        {/* Feature Cards Column List */}
        <div className="space-y-32">
          {/* CARD 1: Digitize Sample Custody (Interactive Video Suite) */}
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Descriptions & Sub-Tabs */}
            <div className="lg:col-span-5 flex flex-col space-y-6 order-2 lg:order-1">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-primary/8 text-primary shadow-sm">
                  <ScanBarcode className="size-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                  DIGITIZE SAMPLE CUSTODY
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display leading-[1.15]">
                Complete specimen traceability in real-time
              </h3>

              {/* Sub-steps Stepper Panel */}
              <div className="space-y-4">
                {custodySteps.map((step, idx) => {
                  const isActive = idx === activeCustodyStep;
                  return (
                    <button
                      key={idx}
                      onClick={() => selectCustodyStep(idx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 ${
                        isActive
                          ? "bg-white border-[#d6e7ff] shadow-sm dark:bg-[#07111c] dark:border-[#1e3456]"
                          : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      }`}
                    >
                      <span
                        className={`text-xs font-mono font-bold h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <h4
                          className={`text-sm font-bold font-display ${isActive ? "text-slate-900 dark:text-white" : "text-slate-500"}`}
                        >
                          {step.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>

                        {/* Stepper Progress Bar */}
                        {isActive && isPlayingCustody && (
                          <div className="w-full h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-75"
                              style={{ width: `${custodyProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlayingCustody(!isPlayingCustody)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 px-3 py-2 text-xs font-semibold font-mono text-slate-600 dark:text-slate-400"
                >
                  {isPlayingCustody ? (
                    <>
                      <Pause className="size-3 text-red-500" /> Pause Video Loop
                    </>
                  ) : (
                    <>
                      <Play className="size-3 text-emerald-500" /> Play Video Loop
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Premium Mockup Card Video Player */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="bg-[#e8f2ff] dark:bg-[#0c192c] p-6 sm:p-8 md:p-10 rounded-[2rem] border border-[#d6e7ff] dark:border-[#1e3456] shadow-sm">
                {/* Mockup Card Container */}
                <div className="bg-white dark:bg-[#07111c] border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] aspect-[4/3] relative overflow-hidden flex flex-col justify-between">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold ml-2">
                        Custody Feed · Video Demo
                      </span>
                    </div>

                    {/* Blinking Live indicator */}
                    <div className="flex items-center gap-1.5 bg-red-50 text-red-500 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
                      <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                      {isPlayingCustody ? "PLAYING" : "PAUSED"}
                    </div>
                  </div>

                  {/* Video Viewport Area */}
                  <div className="flex-1 min-h-0 relative my-3 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-[#080f18]">
                    {/* Simulated High-Fidelity UI screenshot */}
                    <img
                      src={custodySteps[activeCustodyStep].image}
                      alt="Custody UI Mockup"
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />

                    {/* Laser scan beam animation across the mockup */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/8 to-transparent w-full h-1/4 animate-swipe pointer-events-none" />

                    {/* Dynamic HUD watermark label */}
                    <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[8px] font-mono text-white/80 border border-white/10 uppercase tracking-widest">
                      LIMS // STAGE_01_
                      {custodySteps[activeCustodyStep].hud[0].value.replace("-", "_")}
                    </div>
                  </div>

                  {/* Telemetry Footer */}
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 bg-slate-50/50 dark:bg-[#091523]/50 rounded-lg p-2.5">
                    {custodySteps[activeCustodyStep].hud.map((hud, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[8px] font-mono font-bold tracking-wider text-slate-400">
                          {hud.label}
                        </span>
                        <span className="text-xs font-black font-mono mt-0.5 text-primary">
                          {hud.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Standardized Preparation (Video Showcase Loop) */}
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Text Info */}
            <div className="lg:col-span-5 flex flex-col space-y-6 order-2">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-amber-500/8 text-amber-600 shadow-sm">
                  <Workflow className="size-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">
                  PREPARATION MODULE
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display leading-[1.15]">
                Govern preparation stages for homogeneous assays
              </h3>

              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Govern oven drying temperatures and track moisture loss automatically to reach
                  stable analysis mass.
                </p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Control jaw crushers, splitting riffles, and ring pulverizers with standardized
                  operational procedures.
                </p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Ensure high sample homogeneity and elemental liberation for subsequent chemical
                  assaying.
                </p>
              </div>

              <div>
                <button className="inline-flex items-center gap-2 rounded-lg bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-3 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 font-display">
                  Manage Preparation Workflows <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Right Column: Video Showcase Card */}
            <div className="lg:col-span-7 order-1">
              <div className="bg-[#fff9e6] dark:bg-[#201c10] p-6 sm:p-8 md:p-10 rounded-[2rem] border border-[#ffeebf] dark:border-[#38311e] shadow-sm">
                <div className="bg-white dark:bg-[#07111c] border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] aspect-[4/3] relative overflow-hidden flex flex-col justify-between">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold ml-2">
                        Prep SOP · Live Monitor
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
                      <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                      HOMOGENIZING
                    </div>
                  </div>

                  {/* Viewport */}
                  <div className="flex-1 min-h-0 relative my-3 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-[#080f18]">
                    <img
                      src={prepSopImg}
                      alt="Preparation SOP Mockup"
                      className="w-full h-full object-cover"
                    />

                    {/* Glowing swipe cursor indicator simulating video interaction */}
                    <div className="absolute top-1/2 left-1/4 size-3 bg-amber-400 rounded-full blur-[2px] opacity-75 animate-ping" />

                    {/* Simulated vertical progress line */}
                    <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-amber-400/50 animate-swipe-h" />
                  </div>

                  {/* Telemetry */}
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 bg-slate-50/50 dark:bg-[#091523]/50 rounded-lg p-2.5">
                    {[
                      { label: "DRY TEMP", value: "105°C" },
                      { label: "CRUSH SIZE", value: "< 2.0 mm" },
                      { label: "PREP YIELD", value: "99.2%" },
                    ].map((hud, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[8px] font-mono font-bold tracking-wider text-slate-400">
                          {hud.label}
                        </span>
                        <span className="text-xs font-black font-mono mt-0.5 text-amber-600">
                          {hud.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Instrumental Analysis (Video Showcase Loop) */}
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Text Info */}
            <div className="lg:col-span-5 flex flex-col space-y-6 order-2 lg:order-1">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-indigo-50/8 text-indigo-600 shadow-sm">
                  <Beaker className="size-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">
                  ANALYSIS MODULE
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display leading-[1.15]">
                Automate instrument queues and raw data capture
              </h3>

              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Queue samples directly to ICP-MS, AAS, and XRF instruments from automated
                  laboratory schedules.
                </p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Import raw analyzer data feeds directly to eliminate manual data entry
                  transcription errors.
                </p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Track QA/QC control standards alongside regular samples for real-time
                  verification.
                </p>
              </div>

              <div>
                <button className="inline-flex items-center gap-2 rounded-lg bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-3 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 font-display">
                  Connect Laboratory Instruments <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Right Column: Video Showcase Card */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="bg-[#eceaff] dark:bg-[#151228] p-6 sm:p-8 md:p-10 rounded-[2rem] border border-[#dcd9ff] dark:border-[#272147] shadow-sm">
                <div className="bg-white dark:bg-[#07111c] border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] aspect-[4/3] relative overflow-hidden flex flex-col justify-between">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold ml-2">
                        Spectroscopy · Instrument Queue
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
                      <span className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      ACQUIRING
                    </div>
                  </div>

                  {/* Viewport */}
                  <div className="flex-1 min-h-0 relative my-3 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-[#080f18]">
                    <img
                      src={analysisQueueImg}
                      alt="Instrument Queue Mockup"
                      className="w-full h-full object-cover"
                    />

                    {/* Pulsing signal markers simulating chemical elements locking in */}
                    <div className="absolute top-[40%] right-[30%] size-2.5 bg-indigo-500 rounded-full animate-ping" />
                    <div className="absolute top-[60%] right-[40%] size-2 bg-indigo-400 rounded-full animate-ping [animation-delay:0.5s]" />
                  </div>

                  {/* Telemetry */}
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 bg-slate-50/50 dark:bg-[#091523]/50 rounded-lg p-2.5">
                    {[
                      { label: "ICP STATUS", value: "RUNNING" },
                      { label: "Au GRADE", value: "2.45 g/t" },
                      { label: "Cu TOTAL", value: "0.85%" },
                    ].map((hud, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[8px] font-mono font-bold tracking-wider text-slate-400">
                          {hud.label}
                        </span>
                        <span className="text-xs font-black font-mono mt-0.5 text-indigo-600">
                          {hud.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: Analytical Reporting (Video Showcase Loop) */}
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Text Info */}
            <div className="lg:col-span-5 flex flex-col space-y-6 order-2">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-emerald-50/8 text-emerald-600 shadow-sm">
                  <ShieldCheck className="size-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600">
                  REPORTING MODULE
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display leading-[1.15]">
                Publish certified reports with instant compliance
              </h3>

              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Evaluate duplicate variance, blank contamination, and certified reference
                  materials (CRMs) dynamically.
                </p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Compile multi-element assay certificates automatically with double-signoff
                  verification.
                </p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Deliver secure client portals and ISO-compliant PDF certificates with compliance
                  tracking.
                </p>
              </div>

              <div>
                <button className="inline-flex items-center gap-2 rounded-lg bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-3 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 font-display">
                  Verify Analytical QA/QC <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Right Column: Video Showcase Card */}
            <div className="lg:col-span-7 order-1">
              <div className="bg-[#e6f9f0] dark:bg-[#102018] p-6 sm:p-8 md:p-10 rounded-[2rem] border border-[#bfffe0] dark:border-[#1e382b] shadow-sm">
                <div className="bg-white dark:bg-[#07111c] border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] aspect-[4/3] relative overflow-hidden flex flex-col justify-between">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold ml-2">
                        Reporting Registry · Compliance
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ISO CERTIFIED
                    </div>
                  </div>

                  {/* Viewport */}
                  <div className="flex-1 min-h-0 relative my-3 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-[#080f18]">
                    <img
                      src={reportingCertImg}
                      alt="Certificate QA Mockup"
                      className="w-full h-full object-cover"
                    />

                    {/* Simulated digital approval stamp locks overlay */}
                    <div className="absolute inset-0 bg-emerald-500/3 mix-blend-color-dodge opacity-0 hover:opacity-100 transition-opacity" />

                    {/* Success notification banner slide-in simulation */}
                    <div className="absolute bottom-3 left-3 right-3 bg-emerald-600 text-white rounded p-2 text-[9px] font-mono flex items-center gap-2 shadow-md animate-slide-up">
                      <span className="size-2 rounded-full bg-white animate-ping" />
                      REPORT RPT-2041 SIGNED AND DISPATCHED
                    </div>
                  </div>

                  {/* Telemetry */}
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 bg-slate-50/50 dark:bg-[#091523]/50 rounded-lg p-2.5">
                    {[
                      { label: "SIGN OFF", value: "2 APPROVED" },
                      { label: "STANDARD", value: "ISO 17025" },
                      { label: "CHECKSUM", value: "PASS" },
                    ].map((hud, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[8px] font-mono font-bold tracking-wider text-slate-400">
                          {hud.label}
                        </span>
                        <span className="text-xs font-black font-mono mt-0.5 text-emerald-600">
                          {hud.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
