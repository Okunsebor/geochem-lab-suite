import React, { useState, useMemo } from "react";
import { AlertTriangle, Plus, Filter, CheckCircle2, Clock } from "lucide-react";
import { QaFlag, CheckType, FlagSeverity, FlagStatus } from "../../../types";
import { FlagResolveModal } from "./flag-resolve-modal";

interface FlagTableProps {
  flags: QaFlag[];
  onResolve: (flagId: string, resolution: string, action: "Approved" | "Revised") => void;
  onDismiss: (flagId: string) => void;
}

const SEVERITY_META: Record<FlagSeverity, { color: string; bg: string; dot: string }> = {
  Low:    { color: "text-sky-600",   bg: "bg-sky-500/10",   dot: "bg-sky-500" },
  Medium: { color: "text-amber-600", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  High:   { color: "text-rose-600",  bg: "bg-rose-500/10",  dot: "bg-rose-500" },
};

const STATUS_META: Record<FlagStatus, { color: string; bg: string }> = {
  "Open":             { color: "text-muted-foreground", bg: "bg-muted" },
  "Pending Approval": { color: "text-amber-600",        bg: "bg-amber-500/10" },
  "Approved":         { color: "text-emerald-600",      bg: "bg-emerald-500/10" },
  "Revised":          { color: "text-primary",           bg: "bg-primary/10" },
};

const CHECK_TYPES: CheckType[] = ["Duplicate", "Blank", "CRM", "Standard", "Spike"];
const SEVERITIES: FlagSeverity[] = ["Low", "Medium", "High"];
const STATUSES: FlagStatus[] = ["Open", "Pending Approval", "Approved", "Revised"];

export function FlagTable({ flags, onResolve, onDismiss }: FlagTableProps) {
  const [selectedFlag, setSelectedFlag] = useState<QaFlag | null>(null);
  const [filterType,     setFilterType]     = useState<CheckType | "All">("All");
  const [filterSeverity, setFilterSeverity] = useState<FlagSeverity | "All">("All");
  const [filterStatus,   setFilterStatus]   = useState<FlagStatus | "All">("All");
  const [search, setSearch]                 = useState("");

  const filtered = useMemo(() => {
    return flags.filter((f) => {
      if (filterType     !== "All" && f.checkType !== filterType)     return false;
      if (filterSeverity !== "All" && f.severity  !== filterSeverity) return false;
      if (filterStatus   !== "All" && f.status    !== filterStatus)   return false;
      if (search && !f.sampleId.toLowerCase().includes(search.toLowerCase()) &&
          !f.element.toLowerCase().includes(search.toLowerCase()) &&
          !f.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [flags, filterType, filterSeverity, filterStatus, search]);

  const openCount = flags.filter((f) => f.status === "Open" || f.status === "Pending Approval").length;

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="border-b border-border px-5 py-3 flex items-center justify-between bg-muted/20">
          <h3 className="text-sm font-semibold inline-flex items-center gap-2 text-foreground">
            <AlertTriangle className="size-4 text-amber-500" />
            Anomaly Flags
            {openCount > 0 && (
              <span className="rounded-full bg-amber-500/15 text-amber-600 text-xs font-bold px-2 py-0.5">
                {openCount} open
              </span>
            )}
          </h3>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3 bg-background/50">
          <Filter className="size-3.5 text-muted-foreground shrink-0" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sample / element / ID…"
            className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 w-44"
          />

          {/* Check type */}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}
            className="rounded-md border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40">
            <option value="All">All Types</option>
            {CHECK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Severity */}
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="rounded-md border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40">
            <option value="All">All Severities</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Status */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded-md border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40">
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} of {flags.length}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/30 border-b border-border">
              <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-left [&>th]:font-semibold">
                <th>Flag ID</th>
                <th>Sample</th>
                <th>Element</th>
                <th>Check Type</th>
                <th>Observed</th>
                <th>Deviation</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Raised</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                    {flags.length === 0 ? "No anomaly flags raised" : "No flags match the current filters"}
                  </td>
                </tr>
              )}
              {filtered.map((f) => {
                const sevMeta = SEVERITY_META[f.severity];
                const statuMeta = STATUS_META[f.status];
                const isOpen = f.status === "Open" || f.status === "Pending Approval";

                return (
                  <tr
                    key={f.id}
                    className="border-b border-border last:border-0 [&>td]:px-4 [&>td]:py-2.5 font-medium hover:bg-muted/20 transition-colors"
                  >
                    <td className="font-mono text-xs text-muted-foreground">{f.id}</td>
                    <td className="font-mono text-xs text-primary font-semibold">{f.sampleId}</td>
                    <td className="font-semibold">{f.element}</td>
                    <td className="text-xs">{f.checkType}</td>
                    <td className="font-mono text-xs">{f.observedValue.toFixed(4)}</td>
                    <td>
                      {f.percentDeviation != null ? (
                        <span className={`text-xs font-semibold ${sevMeta.color}`}>
                          {f.percentDeviation.toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${sevMeta.bg} ${sevMeta.color}`}>
                        <span className={`size-1.5 rounded-full ${sevMeta.dot}`} />
                        {f.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statuMeta.bg} ${statuMeta.color}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {new Date(f.raisedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td>
                      {isOpen && (
                        <button
                          onClick={() => setSelectedFlag(f)}
                          className="text-xs text-primary hover:underline font-semibold whitespace-nowrap"
                        >
                          Resolve
                        </button>
                      )}
                      {!isOpen && f.resolution && (
                        <button
                          onClick={() => setSelectedFlag(f)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                          title={f.resolution}
                        >
                          <CheckCircle2 className="size-3.5" /> View
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedFlag && (
        <FlagResolveModal
          flag={selectedFlag}
          onResolve={onResolve}
          onClose={() => setSelectedFlag(null)}
        />
      )}
    </>
  );
}
