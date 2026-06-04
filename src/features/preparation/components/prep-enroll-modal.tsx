import React, { useState, useMemo } from "react";
import { X, Search, Plus, CheckCircle2 } from "lucide-react";
import { Sample, Priority } from "../../../types";
import { StatusBadge } from "../../../components/shared/StatusBadge";

interface PrepEnrollModalProps {
  samples: Sample[];
  enrolledSampleIds: Set<string>;
  onEnroll: (
    sampleId: string,
    client: string,
    project: string,
    sampleType: string,
    priority: Priority,
  ) => void;
  onClose: () => void;
}

export function PrepEnrollModal({
  samples,
  enrolledSampleIds,
  onEnroll,
  onClose,
}: PrepEnrollModalProps) {
  const [search, setSearch] = useState("");
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());

  // Eligible samples: Verified status, not already enrolled
  const eligible = useMemo(
    () =>
      samples.filter(
        (s) =>
          s.status === "Verified" &&
          !enrolledSampleIds.has(s.id) &&
          !enrolled.has(s.id) &&
          (search === "" ||
            s.id.toLowerCase().includes(search.toLowerCase()) ||
            s.client.toLowerCase().includes(search.toLowerCase()) ||
            s.project.toLowerCase().includes(search.toLowerCase())),
      ),
    [samples, enrolledSampleIds, enrolled, search],
  );

  const handleEnroll = (s: Sample) => {
    onEnroll(s.id, s.client, s.project, s.type, s.priority);
    setEnrolled((prev) => new Set(prev).add(s.id));
  };

  const handleEnrollAll = () => {
    eligible.forEach((s) => handleEnroll(s));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Enroll Samples in Preparation
            </h3>
            <p className="text-xs text-muted-foreground">
              Verified samples ready for the prep workflow
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-border px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, client, or project…"
              className="w-full rounded-md border border-border bg-muted/30 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {eligible.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <CheckCircle2 className="size-8 text-emerald-500" />
              <p className="text-sm font-medium">
                {enrolled.size > 0
                  ? `${enrolled.size} sample${enrolled.size > 1 ? "s" : ""} enrolled!`
                  : "No eligible samples found"}
              </p>
              <p className="text-xs">Samples must have status "Verified" to be enrolled</p>
            </div>
          )}
          {eligible.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">{s.id}</span>
                  <StatusBadge status={s.priority} />
                </div>
                <p className="text-sm font-medium text-foreground truncate">{s.client}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {s.project} · {s.type}
                </p>
              </div>
              <button
                onClick={() => handleEnroll(s)}
                className="flex items-center gap-1.5 shrink-0 rounded-md gradient-primary px-3 py-1.5 text-xs text-white font-semibold hover:opacity-90 transition"
              >
                <Plus className="size-3" /> Enroll
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 flex items-center gap-3 bg-muted/10">
          <span className="text-xs text-muted-foreground">
            {eligible.length} eligible · {enrolled.size} enrolled this session
          </span>
          {eligible.length > 1 && (
            <button
              onClick={handleEnrollAll}
              className="ml-auto flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
            >
              <Plus className="size-3" /> Enroll All ({eligible.length})
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-md border border-border bg-background px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
