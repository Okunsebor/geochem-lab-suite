import {
  Search,
  Command,
  X,
  FlaskConical,
  FileText,
  ChevronRight,
  Users,
  Loader2,
  LayoutDashboard,
  Workflow,
  Activity,
  Settings,
  ScanBarcode,
  Beaker,
  ShieldCheck,
  Boxes,
  ClipboardList,
  BarChart3,
  Users2,
  HardDrive,
  LifeBuoy,
} from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLimsState } from "@/hooks/use-lims-state";
import { supabase } from "@/lib/supabase";
import { Sample, AnalyticalReport, User } from "@/types";

// Standard LIMS navigation workflows
const WORKFLOW_LINKS = [
  {
    label: "Operational Dashboard",
    to: "/app",
    description: "Real-time KPIs, throughput plots, and QA metrics",
  },
  {
    label: "Intake Registry",
    to: "/app/intake",
    description: "Register inbound geological splits and container bags",
  },
  {
    label: "Samples Directory",
    to: "/app/samples",
    description: "Active inventories, storage racks, and data grids",
  },
  {
    label: "Sample Preparation",
    to: "/app/preparation",
    description: "Crushing, pulverizing, split testing, and matrix prep",
  },
  {
    label: "Analytical Runs",
    to: "/app/analysis",
    description: "ICP-MS, ICP-OES, Fire Assay instrumental workflows",
  },
  {
    label: "QA/QC Audits",
    to: "/app/qa-qc",
    description: "Standard deviations, CRM reference checks, and flags",
  },
  {
    label: "Reports Sign-off",
    to: "/app/reports",
    description: "Approve, sign, and deliver certified analytical PDFs",
  },
  {
    label: "System Administration",
    to: "/app/settings",
    description: "Accreditation configs, webhooks, branding, and billing",
  },
  {
    label: "Customer Portal",
    to: "/portal",
    description: "External client shipping pre-registration and downloads",
  },
];

export function TopbarSearch() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Database search query results
  const [dbSamples, setDbSamples] = useState<Sample[]>([]);
  const [dbReports, setDbReports] = useState<AnalyticalReport[]>([]);
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const { samples, reports, users } = useLimsState();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when command palette opens
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearch]);

  // 1. Debounced database search query matching
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setDbSamples([]);
      setDbReports([]);
      setDbUsers([]);
      setIsLoadingDb(false);
      return;
    }

    setIsLoadingDb(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        let qTrim = searchQuery.trim().toLowerCase();
        // Hardware barcode scanner wedge sanitization (trim trailing/leading asterisks from Code 39)
        if (qTrim.startsWith("*") && qTrim.endsWith("*") && qTrim.length > 2) {
          qTrim = qTrim.slice(1, -1);
        }

        // Perform parallel queries to Supabase
        const [samplesQuery, reportsQuery, usersQuery] = await Promise.all([
          supabase
            .from("samples" as any)
            .select("*")
            .or(
              `id.ilike.%${qTrim}%,project_name.ilike.%${qTrim}%,client_org_id.ilike.%${qTrim}%,matrix.ilike.%${qTrim}%`,
            )
            .limit(5),
          supabase
            .from("reports" as any)
            .select("*")
            .or(`id.ilike.%${qTrim}%,sample_id.ilike.%${qTrim}%,client.ilike.%${qTrim}%`)
            .limit(5),
          supabase
            .from("users" as any)
            .select("*")
            .or(`full_name.ilike.%${qTrim}%,email.ilike.%${qTrim}%`)
            .limit(5),
        ]);

        // Process samples matches
        if (samplesQuery.data && samplesQuery.data.length > 0) {
          const mapped: Sample[] = samplesQuery.data.map((s: any) => ({
            id: s.id,
            client:
              s.client_name ||
              s.client ||
              (s.client_org_id === "org-barrick" ? "Barrick Gold" : "Auric Mining"),
            project: s.project_name || s.project || "Exploration",
            type: s.sample_type || s.type || "Core Split",
            status: s.status || "Received",
            receivedAt: s.created_at || new Date().toISOString(),
            technician: s.technician || "Staff",
            priority: s.priority || "Normal",
            location: s.storage_location || s.location || "Rack B-12",
            weight: s.weight_kg ? `${s.weight_kg} kg` : "2.5 kg",
          }));
          setDbSamples(mapped);
        } else {
          // Fallback to local state if Supabase has no hits
          const localFiltered = samples
            .filter(
              (s: Sample) =>
                s.id.toLowerCase().includes(qTrim) ||
                s.client.toLowerCase().includes(qTrim) ||
                s.project.toLowerCase().includes(qTrim) ||
                (s.matrix && s.matrix.toLowerCase().includes(qTrim)),
            )
            .slice(0, 5);
          setDbSamples(localFiltered);
        }

        // Process reports matches
        if (reportsQuery.data && reportsQuery.data.length > 0) {
          const mapped: AnalyticalReport[] = reportsQuery.data.map((r: any) => ({
            id: r.id,
            sample: r.sample_id,
            client: r.client,
            status: r.status,
            createdAt: r.created_at || new Date().toISOString(),
            pages: r.pages || 1,
            pdfUrl: r.pdf_url,
          }));
          setDbReports(mapped);
        } else {
          const localFiltered = reports
            .filter(
              (r: AnalyticalReport) =>
                r.id.toLowerCase().includes(qTrim) ||
                r.sample.toLowerCase().includes(qTrim) ||
                r.client.toLowerCase().includes(qTrim),
            )
            .slice(0, 5);
          setDbReports(localFiltered);
        }

        // Process users matches
        if (usersQuery.data && usersQuery.data.length > 0) {
          const mapped: User[] = usersQuery.data.map((u: any) => ({
            id: Number(u.id) || 1,
            name: u.full_name,
            email: u.email,
            role: u.role,
            status: u.status,
            lastSeen: u.last_seen || "Just now",
          }));
          setDbUsers(mapped);
        } else {
          const localFiltered = users
            .filter(
              (u: User) =>
                u.name.toLowerCase().includes(qTrim) || u.email.toLowerCase().includes(qTrim),
            )
            .slice(0, 5);
          setDbUsers(localFiltered);
        }
      } catch (err) {
        console.warn("Supabase Search index query offline, fallback to LIMS Cache:", err);
        const qTrim = searchQuery.trim().toLowerCase();
        setDbSamples(
          samples
            .filter(
              (s: Sample) =>
                s.id.toLowerCase().includes(qTrim) ||
                s.client.toLowerCase().includes(qTrim) ||
                s.project.toLowerCase().includes(qTrim),
            )
            .slice(0, 5),
        );
        setDbReports(
          reports
            .filter(
              (r: AnalyticalReport) =>
                r.id.toLowerCase().includes(qTrim) ||
                r.sample.toLowerCase().includes(qTrim) ||
                r.client.toLowerCase().includes(qTrim),
            )
            .slice(0, 5),
        );
        setDbUsers(
          users
            .filter(
              (u: User) =>
                u.name.toLowerCase().includes(qTrim) || u.email.toLowerCase().includes(qTrim),
            )
            .slice(0, 5),
        );
      } finally {
        setIsLoadingDb(false);
      }
    }, 150); // 150ms debounce threshold for optimized query frequency

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, samples, reports, users]);

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    return searchQuery.trim() === ""
      ? []
      : WORKFLOW_LINKS.filter(
          (w) =>
            w.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.description.toLowerCase().includes(searchQuery.toLowerCase()),
        );
  }, [searchQuery]);

  // Flatten active results for clean index selection
  const flatResults = useMemo(() => {
    return [
      ...filteredWorkflows.map((w) => ({
        type: "workflow" as const,
        label: w.label,
        to: w.to,
        subtitle: w.description,
      })),
      ...dbSamples.map((s) => ({
        type: "sample" as const,
        label: s.id,
        to: `/app/samples/${s.id}`,
        subtitle: `${s.client} (${s.project}) · ${s.status}`,
      })),
      ...dbReports.map((r) => ({
        type: "report" as const,
        label: r.id,
        to: `/app/reports`,
        subtitle: `Certificate for ${r.client} · ${r.status}`,
      })),
      ...dbUsers.map((u) => ({
        type: "user" as const,
        label: u.name,
        to: `/app/settings`,
        subtitle: `${u.role} · ${u.email}`,
      })),
    ];
  }, [filteredWorkflows, dbSamples, dbReports, dbUsers]);

  // Reset focus index when result set changes
  useEffect(() => {
    setFocusedIndex(0);
  }, [flatResults.length]);

  const handleResultClick = (to: string) => {
    setShowSearch(false);
    setSearchQuery("");
    navigate({ to });
  };

  // Keyboard shortcut listener (Cmd+K / Ctrl+K, Arrow keys, Enter, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
        setSearchQuery("");
      } else if (e.key === "Escape") {
        setShowSearch(false);
      } else if (showSearch && flatResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % flatResults.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleResultClick(flatResults[focusedIndex].to);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, flatResults, focusedIndex]);

  return (
    <>
      <button
        onClick={() => setShowSearch(true)}
        className="group interactive-lift interactive-motion flex w-full max-w-md items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/40"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left truncate">Search samples, reports, instruments...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono shrink-0">
          <Command className="size-3" />K
        </kbd>
      </button>

      {/* Command Search Palette Dialog Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <div
            className="absolute inset-0 bg-background/85 backdrop-blur-sm"
            onClick={() => setShowSearch(false)}
          />
          <div className="relative z-10 w-full max-w-lg shadow-2xl p-4 overflow-hidden animate-in fade-in zoom-in-95 duration-150 glass">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <Search className="size-4 text-primary" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search IDs, clients, reports, workflows..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none"
              />
              {isLoadingDb && <Loader2 className="size-4 text-primary animate-spin shrink-0" />}
              <button
                onClick={() => setShowSearch(false)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Results Grid */}
            <div className="mt-3 max-h-[320px] overflow-y-auto divide-y divide-border/60">
              {searchQuery.trim() === "" ? (
                <div className="py-8 text-center text-xs text-muted-foreground font-semibold flex flex-col items-center gap-1.5">
                  <Command className="size-6 text-muted-foreground/50" />
                  <span>Search GeoChem Suite Registry</span>
                  <span className="text-[10px] text-muted-foreground/60 font-medium">
                    Search Samples, Reports, LIMS Technicians, and Operations workflows instantly.
                  </span>
                </div>
              ) : flatResults.length === 0 && !isLoadingDb ? (
                <div className="py-8 text-center text-xs text-muted-foreground font-semibold flex flex-col items-center gap-1.5">
                  <span>No matching records found for "{searchQuery}"</span>
                  <span className="text-[10px] text-muted-foreground/60 font-medium">
                    Try searching for GCS serials, matrix types, client names, or LIMS technician
                    profiles.
                  </span>
                </div>
              ) : (
                <div className="py-2 space-y-1.5">
                  {flatResults.map((item, idx) => {
                    const isFocused = idx === focusedIndex;
                    const Icon =
                      item.type === "workflow"
                        ? Command
                        : item.type === "sample"
                          ? FlaskConical
                          : item.type === "report"
                            ? FileText
                            : Users;
                    return (
                      <button
                        key={`${item.type}-${item.label}-${idx}`}
                        onClick={() => handleResultClick(item.to)}
                        className={`w-full text-left rounded-md px-3 py-2.5 text-xs font-semibold transition flex items-center justify-between group cursor-pointer ${
                          isFocused ? "bg-primary text-white" : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`size-4 shrink-0 ${isFocused ? "text-white" : "text-primary"}`}
                          />
                          <div className="min-w-0 flex flex-col">
                            <span className="truncate font-semibold text-foreground/90 group-hover:text-foreground group-[.bg-primary]:text-white">
                              {item.label}
                            </span>
                            <span
                              className={`text-[10px] truncate ${isFocused ? "text-white/80" : "text-muted-foreground"}`}
                            >
                              {item.subtitle}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          className={`size-3 shrink-0 ${isFocused ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-border mt-3 pt-2 text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                Press <kbd className="bg-muted px-1 rounded">↑↓</kbd> to navigate,{" "}
                <kbd className="bg-muted px-1 rounded">Enter</kbd> to open
              </span>
              <span>Cmd+K to toggle overlay</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
