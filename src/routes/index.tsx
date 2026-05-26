import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  FlaskConical, ShieldCheck, Workflow, BarChart3, ScanBarcode,
  ArrowRight, CheckCircle2, Beaker, Building2, LineChart,
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

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-md gradient-primary text-white">
              <FlaskConical className="size-4" />
            </div>
            <span className="font-semibold tracking-tight">GeoChem Suite</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#platform" className="hover:text-foreground">Platform</a>
            <a href="#modules" className="hover:text-foreground">Modules</a>
            <a href="#analytics" className="hover:text-foreground">Analytics</a>
            <a href="#security" className="hover:text-foreground">Security</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">Sign in</Link>
            <Link to="/app" className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-90">
              Launch app <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute inset-0 grid-pattern opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Trusted by 240+ labs · ISO 17025 ready
            </span>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
              The modern <span className="text-gradient">geochemical LIMS</span> built for production labs
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              From sample intake to certified report — one platform for chain-of-custody,
              preparation, analysis, QA/QC and customer delivery.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/app" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90">
                Open live demo <ArrowRight className="size-4" />
              </Link>
              <Link to="/portal" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted">
                Customer portal preview
              </Link>
            </div>
          </motion.div>

          {/* Dashboard preview card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}
            className="relative mx-auto mt-16 max-w-6xl"
          >
            <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-destructive/60" />
                <span className="size-2.5 rounded-full bg-warning/60" />
                <span className="size-2.5 rounded-full bg-success/60" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">app.geochem.suite/dashboard</span>
              </div>
              <div className="grid grid-cols-12 gap-4 p-5">
                {[
                  { l: "Active Samples", v: "1,284", d: "+12.4%" },
                  { l: "Turnaround", v: "3.2d", d: "-0.4d" },
                  { l: "QA Pass", v: "98.6%", d: "+0.8%" },
                  { l: "Overdue", v: "7", d: "-3" },
                ].map((k) => (
                  <div key={k.l} className="col-span-6 sm:col-span-3 rounded-lg border border-border p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.l}</p>
                    <p className="mt-1 text-xl font-semibold">{k.v}</p>
                    <p className="text-[10px] text-success">{k.d}</p>
                  </div>
                ))}
                <div className="col-span-12 lg:col-span-8 rounded-lg border border-border p-4">
                  <p className="text-xs font-medium text-muted-foreground">Throughput · last 14 days</p>
                  <div className="mt-3 flex h-32 items-end gap-1">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div key={i} className="flex-1 rounded-t gradient-primary opacity-80" style={{ height: `${30 + Math.abs(Math.sin(i / 2)) * 70}%` }} />
                    ))}
                  </div>
                </div>
                <div className="col-span-12 lg:col-span-4 rounded-lg border border-border p-4">
                  <p className="text-xs font-medium text-muted-foreground">Workflow</p>
                  <ul className="mt-3 space-y-2 text-xs">
                    {["Preparation · 312","Analysis · 268","QA/QC · 96","Reporting · 84"].map((x) => (
                      <li key={x} className="flex items-center justify-between rounded border border-border bg-muted/30 px-2 py-1.5">
                        <span>{x}</span>
                        <span className="text-success">↑</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Modules</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">A complete laboratory workflow, end-to-end</h2>
            <p className="mt-3 text-muted-foreground">Every stage of geochemical analysis instrumented — with audit trails, role-based access and real-time visibility.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { i: ScanBarcode, t: "Sample Intake", d: "Barcode/QR registration, chain-of-custody, storage assignment." },
              { i: Workflow, t: "Preparation", d: "Kanban workflows for drying, crushing, splitting, pulverizing." },
              { i: Beaker, t: "Analysis", d: "Instrument queues, raw data ingestion, method libraries." },
              { i: ShieldCheck, t: "QA / QC", d: "Duplicates, blanks, CRM tracking and anomaly flagging." },
              { i: BarChart3, t: "Reporting", d: "Branded PDF reports, approvals, customer delivery." },
              { i: Building2, t: "Customer Portal", d: "Self-service tracking, downloads and ticketing." },
            ].map((m) => (
              <div key={m.t} className="group rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition">
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <m.i className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{m.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section id="platform" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Platform</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Built for the realities of an assay lab</h2>
            <p className="mt-3 text-muted-foreground">No more spreadsheets, paper logs, or chasing technicians for status. GeoChem Suite gives every role the surface they actually need.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Role-based dashboards for Admin, Lab, and Customer",
                "Full chain-of-custody with timestamped events",
                "Instrument queues and calibration tracking",
                "QA/QC engine with duplicate spread alerts",
                "Branded PDF reporting with approval workflow",
              ].map((x) => (
                <li key={x} className="flex gap-2"><CheckCircle2 className="size-4 text-success mt-0.5" />{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LineChart className="size-4" /> Live operational view
            </div>
            <div className="mt-4 space-y-2">
              {[
                ["GCS-24012", "In Analysis", "ICP-MS-01", "82%"],
                ["GCS-24008", "Preparation", "Pulverizer 2", "44%"],
                ["GCS-24004", "QA Flagged", "Au duplicate spread", "—"],
                ["GCS-24001", "Report Ready", "RPT-2041", "100%"],
              ].map(([id, st, who, pct]) => (
                <div key={id} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                  <span className="col-span-3 font-mono">{id}</span>
                  <span className="col-span-3 text-muted-foreground">{st}</span>
                  <span className="col-span-4 truncate text-muted-foreground">{who}</span>
                  <span className="col-span-2 text-right font-medium">{pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="border-t border-border bg-gradient-to-b from-background to-card/30">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Ready to digitize your lab?</h2>
          <p className="mt-3 text-muted-foreground">Launch the live demo and explore the full workflow — no signup required.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/app" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90">
              Open the platform <ArrowRight className="size-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="grid size-6 place-items-center rounded gradient-primary text-white"><FlaskConical className="size-3" /></div>
            <span>© 2026 GeoChem Suite — All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Docs</a>
            <a href="#" className="hover:text-foreground">Security</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
