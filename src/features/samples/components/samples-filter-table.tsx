import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Download,
  Filter,
  Plus,
  Upload,
  MoreHorizontal,
  ScanBarcode,
  ArrowUpDown,
  ChevronRight,
  X,
  CheckCircle,
  RefreshCw,
  Printer,
} from "lucide-react";
import { useLimsState } from "../../../hooks/use-lims-state";
import { DataTable } from "../../../components/shared/data-table";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { PageHeader } from "../../../components/layout/PageHeader";
import { SAMPLE_STATUSES, Priority, SampleStatus } from "../../../types";
import { toast } from "sonner";
import {
  generateSamplesCsv,
  generateSamplesExcel,
  generateSamplesPdf,
  downloadBlob,
} from "../../../lib/export-service";
import { generateCode39Svg, generateQrCodeSvg } from "../../../lib/barcode-utils";

interface SampleTableRowProps {
  sample: any;
  isChecked: boolean;
  onSelectRow: (id: string, checked: boolean) => void;
  onQuickScanTrigger: (id: string) => void;
}

const SampleTableRow = React.memo(
  ({ sample, isChecked, onSelectRow, onQuickScanTrigger }: SampleTableRowProps) => {
    return (
      <tr
        className={`border-t border-border hover:bg-muted/30 [&>td]:px-4 [&>td]:py-2.5 transition-colors ${
          isChecked ? "bg-primary/5" : ""
        }`}
      >
        <td>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onSelectRow(sample.id, e.target.checked)}
            className="rounded cursor-pointer text-primary focus:ring-primary"
          />
        </td>
        <td className="font-mono text-xs">
          <Link
            to="/app/samples/$id"
            params={{ id: sample.id }}
            className="text-primary hover:underline font-semibold"
          >
            {sample.id}
          </Link>
        </td>
        <td className="font-semibold text-foreground">{sample.client}</td>
        <td className="text-muted-foreground font-medium">{sample.project}</td>
        <td className="font-medium text-foreground">{sample.type}</td>
        <td>
          <StatusBadge status={sample.priority} />
        </td>
        <td className="text-muted-foreground font-semibold text-xs">{sample.technician}</td>
        <td className="font-mono text-xs">{sample.location}</td>
        <td>
          <StatusBadge status={sample.status} />
        </td>
        <td className="w-24">
          <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                  printWindow.document.write(`
                  <html>
                    <head>
                      <title>Print Label ${sample.id}</title>
                      <style>
                        body {
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                          height: 100vh;
                          margin: 0;
                          font-family: 'Courier New', Courier, monospace;
                          background-color: #fff;
                          color: #000;
                        }
                        .label-container {
                          border: 4px solid #000;
                          padding: 20px;
                          border-radius: 12px;
                          text-align: center;
                          width: 360px;
                        }
                        .barcode-box {
                          width: 100%;
                          height: 100px;
                          margin: 10px 0;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        }
                        .barcode-box svg { max-width: 100%; max-height: 100%; }
                        button { display: none; }
                      </style>
                    </head>
                    <body onload="window.print(); window.close();">
                      <div class="label-container">
                        <h2 style="margin: 0 0 5px 0; font-size: 16px; letter-spacing: 1px;">GEOChem LIMS Tag</h2>
                        <div class="barcode-box">
                          ${generateCode39Svg(sample.id)}
                        </div>
                        <h3 style="margin: 5px 0; font-size: 18px; font-weight: bold; font-family: monospace;">ID: ${sample.id}</h3>
                        <p style="margin: 3px 0; font-size: 12px; font-weight: bold;">Client: ${sample.client}</p>
                      </div>
                    </body>
                  </html>
                `);
                  printWindow.document.close();
                }
                toast.success(`Label print dispatched for ${sample.id}`);
              }}
              className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-primary cursor-pointer transition inline-flex"
              title="Instant print label"
            >
              <Printer className="size-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickScanTrigger(sample.id);
              }}
              className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-primary cursor-pointer transition inline-flex"
              title="Contextual scanning actions"
            >
              <ScanBarcode className="size-3.5" />
            </button>
            <Link
              to="/app/samples/$id"
              params={{ id: sample.id }}
              className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition inline-flex"
              title="Open specifications sheet"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </td>
      </tr>
    );
  },
);

SampleTableRow.displayName = "SampleTableRow";

export function SamplesFilterTable() {
  const { samples, registerSample, updateSampleStatus, logBarcodeScan, fetchSamplePage } = useLimsState();
  const navigate = useNavigate();

  // Search & Filter state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Selection & Bulk actions state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Export Configurations state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("csv");
  const [exportScope, setExportScope] = useState<"selected" | "filtered" | "all">("filtered");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (selectedIds.length > 0) {
      setExportScope("selected");
    } else {
      if (exportScope === "selected") {
        setExportScope("filtered");
      }
    }
  }, [selectedIds.length]);

  // Simulation Modals state
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanQuery, setScanQuery] = useState("");
  const [scanMode, setScanMode] = useState<"lookup" | "transit" | "transition">("lookup");
  const [transitLocation, setTransitLocation] = useState("Prep Bench");
  const [targetTransitionStatus, setTargetTransitionStatus] =
    useState<SampleStatus>("In Preparation");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Pagination & Server State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [serverData, setServerData] = useState<any[]>([]);
  const [serverTotalCount, setServerTotalCount] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoadingData(true);
      setFetchError(null);
      try {
        const { data, totalCount } = await fetchSamplePage(currentPage, itemsPerPage, {
          q,
          status,
          type: filterType,
          priority: filterPriority,
          sortField,
          sortDirection,
        });
        if (active) {
          setServerData(data);
          setServerTotalCount(totalCount);
          setIsLoadingData(false);
        }
      } catch (err: any) {
        if (active) {
          setFetchError(err.message || "Failed to load LIMS samples from database.");
          setIsLoadingData(false);
        }
      }
    };
    load();
    return () => { active = false; };
  }, [currentPage, itemsPerPage, q, status, filterType, filterPriority, sortField, sortDirection, fetchSamplePage, reloadTrigger]);

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 1. Dynamic filtering
  const filtered = useMemo(() => {
    return samples.filter((s) => {
      const statusMatch = status === "All" || s.status === status;
      const priorityMatch = filterPriority === "All" || s.priority === filterPriority;
      const typeMatch = filterType === "All" || s.type === filterType;
      const queryMatch =
        q === "" ||
        s.id.toLowerCase().includes(q.toLowerCase()) ||
        s.client.toLowerCase().includes(q.toLowerCase()) ||
        s.project.toLowerCase().includes(q.toLowerCase());
      return statusMatch && priorityMatch && typeMatch && queryMatch;
    });
  }, [samples, q, status, filterPriority, filterType]);

  // 2. Dynamic sorting
  const sortedData = useMemo(() => {
    return [...filtered].sort((a: any, b: any) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

      if (sortField === "id") {
        aVal = parseInt(a.id.replace("GCS-", ""), 10) || 0;
        bVal = parseInt(b.id.replace("GCS-", ""), 10) || 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDirection]);

  // 3. Pagination & Final Data Resolution
  const totalPages = serverTotalCount !== null 
    ? Math.ceil(serverTotalCount / itemsPerPage) 
    : Math.ceil(sortedData.length / itemsPerPage);
    
  const paginatedData = useMemo(() => {
    if (serverTotalCount !== null) return serverData;
    return sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedData, currentPage, serverData, serverTotalCount, itemsPerPage]);

  // Bulk selectors
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedData.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = React.useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  }, []);

  const handleQuickScanTrigger = React.useCallback((id: string) => {
    setScanQuery(id);
    setShowScanModal(true);
  }, []);

  // Export Settings Modal toggle
  const handleExport = () => {
    if (samples.length === 0) {
      toast.error("No LIMS data records available to export.");
      return;
    }
    setShowExportModal(true);
  };

  const handleExecuteExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading(`Generating LIMS ${exportFormat.toUpperCase()} export...`);

    // Small delay to ensure loader fits UI thread
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      // 1. Resolve Target Dataset
      let targetDataset = [];
      if (exportScope === "selected") {
        targetDataset = samples.filter((s) => selectedIds.includes(s.id));
      } else if (exportScope === "filtered") {
        targetDataset = filtered;
      } else {
        targetDataset = samples;
      }

      if (targetDataset.length === 0) {
        throw new Error("No sample records resolved in the chosen export scope.");
      }

      // 2. Generate Blob
      let blob: Blob;
      let extension = "";
      if (exportFormat === "csv") {
        blob = generateSamplesCsv(targetDataset);
        extension = "csv";
      } else if (exportFormat === "excel") {
        blob = generateSamplesExcel(targetDataset);
        extension = "xls";
      } else {
        blob = generateSamplesPdf(targetDataset);
        extension = "pdf";
      }

      // 3. Download
      const filename = `LIMS_Samples_${exportScope}_${Date.now()}.${extension}`;
      downloadBlob(blob, filename);

      toast.success(
        `${targetDataset.length} samples exported to ${exportFormat.toUpperCase()} successfully!`,
        { id: toastId },
      );
      setShowExportModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate file export.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // CSV Import handler
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    toast.loading(`Parsing and uploading import template: ${file.name}...`);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim() !== "");
      if (lines.length <= 1) {
        throw new Error("CSV file does not contain valid data rows.");
      }

      let successCount = 0;
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        // Simple CSV splitter
        const parts = lines[i].split(",").map((p) => p.replace(/"/g, "").trim());
        if (parts.length >= 3) {
          const client = parts[1] || "Auric Mining Ltd";
          const project = parts[2] || "Exploration Import";
          const type = parts[3] || "Core Split";
          const priority = (parts[4] as Priority) || "Normal";
          const location = parts[5] || "Inbound Bin";

          await registerSample({
            client,
            project,
            type,
            weight: "2.5 kg",
            priority,
            location,
          });
          successCount++;
        }
      }

      toast.dismiss();
      toast.success(`Import succeeded! ${successCount} LIMS samples registered.`);
      setCurrentPage(1);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Spreadsheet parsing failed. Ensure format matches template.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Bulk Status Update handler
  const handleBulkStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkStatus || selectedIds.length === 0) return;

    setIsBulkUpdating(true);
    toast.loading(`Processing batch transition for ${selectedIds.length} samples...`);

    try {
      for (const id of selectedIds) {
        await updateSampleStatus(id, bulkStatus as SampleStatus);
      }
      toast.dismiss();
      toast.success(`Bulk update succeeded! ${selectedIds.length} samples moved to ${bulkStatus}.`);
      setSelectedIds([]);
      setBulkStatus("");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to complete bulk status updates.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Barcode scan simulation submit handler
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanId = scanQuery.trim().toUpperCase();
    if (!cleanId) return;

    // Hardware barcode scanner wedge sanitization (trim trailing/leading asterisks from Code 39)
    if (cleanId.startsWith("*") && cleanId.endsWith("*") && cleanId.length > 2) {
      cleanId = cleanId.slice(1, -1);
    }

    const sampleMatch = samples.find((s) => s.id === cleanId);
    if (!sampleMatch) {
      toast.error(`Scan mismatch: Sample ID "${cleanId}" not found in LIMS registry.`);
      return;
    }

    if (scanMode === "lookup") {
      setShowScanModal(false);
      setScanQuery("");
      toast.success(`Scan matched! Opened details for ${cleanId}`);
      navigate({ to: `/app/samples/${cleanId}` });
    } else if (scanMode === "transit") {
      try {
        await logBarcodeScan(cleanId, transitLocation, `Transit scan logged at ${transitLocation}`);
        toast.success(`Transit successfully logged: ${cleanId} checked in at ${transitLocation}`);
        setScanQuery(""); // Keep open for rapid sequential scans
      } catch (err) {
        toast.error("Failed to log transit scan.");
      }
    } else if (scanMode === "transition") {
      try {
        await updateSampleStatus(cleanId, targetTransitionStatus);
        await logBarcodeScan(
          cleanId,
          sampleMatch.location,
          `Workflow scan: status moved to ${targetTransitionStatus}`,
        );
        toast.success(`Workflow Transition: ${cleanId} moved to ${targetTransitionStatus}`);
        setScanQuery(""); // Keep open for rapid sequential scans
      } catch (err) {
        toast.error("Failed to transition sample status.");
      }
    }
  };

  // Table row headers with sorting controls
  const headers = [
    <input
      type="checkbox"
      key="check"
      checked={paginatedData.length > 0 && paginatedData.every((s) => selectedIds.includes(s.id))}
      onChange={(e) => handleSelectAll(e.target.checked)}
      className="rounded cursor-pointer text-primary focus:ring-primary"
    />,
    <button
      key="id"
      onClick={() => handleSort("id")}
      className="flex items-center gap-1 hover:text-white font-semibold cursor-pointer"
    >
      Sample ID <ArrowUpDown className="size-3" />
    </button>,
    <button
      key="client"
      onClick={() => handleSort("client")}
      className="flex items-center gap-1 hover:text-white font-semibold cursor-pointer"
    >
      Client <ArrowUpDown className="size-3" />
    </button>,
    <button
      key="project"
      onClick={() => handleSort("project")}
      className="flex items-center gap-1 hover:text-white font-semibold cursor-pointer"
    >
      Project <ArrowUpDown className="size-3" />
    </button>,
    <button
      key="type"
      onClick={() => handleSort("type")}
      className="flex items-center gap-1 hover:text-white font-semibold cursor-pointer"
    >
      Type <ArrowUpDown className="size-3" />
    </button>,
    <button
      key="priority"
      onClick={() => handleSort("priority")}
      className="flex items-center gap-1 hover:text-white font-semibold cursor-pointer"
    >
      Priority <ArrowUpDown className="size-3" />
    </button>,
    <button
      key="technician"
      onClick={() => handleSort("technician")}
      className="flex items-center gap-1 hover:text-white font-semibold cursor-pointer"
    >
      Technician <ArrowUpDown className="size-3" />
    </button>,
    <button
      key="location"
      onClick={() => handleSort("location")}
      className="flex items-center gap-1 hover:text-white font-semibold cursor-pointer"
    >
      Storage <ArrowUpDown className="size-3" />
    </button>,
    <button
      key="status"
      onClick={() => handleSort("status")}
      className="flex items-center gap-1 hover:text-white font-semibold cursor-pointer"
    >
      Status <ArrowUpDown className="size-3" />
    </button>,
    "",
  ];

  const renderRow = (s: any) => {
    return (
      <SampleTableRow
        key={s.id}
        sample={s}
        isChecked={selectedIds.includes(s.id)}
        onSelectRow={handleSelectRow}
        onQuickScanTrigger={handleQuickScanTrigger}
      />
    );
  };

  const filtersSlot = (
    <>
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setCurrentPage(1);
        }}
        className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none cursor-pointer focus:border-primary font-medium"
      >
        <option value="All">All Statuses</option>
        {SAMPLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <button
        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm cursor-pointer transition font-medium ${
          showAdvancedFilters
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-background hover:bg-muted"
        }`}
      >
        <Filter className="size-3.5" /> Filters
      </button>

      <button
        onClick={() => setShowScanModal(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm hover:bg-muted cursor-pointer transition font-medium"
      >
        <ScanBarcode className="size-3.5" /> Scan
      </button>
    </>
  );

  return (
    <div className="space-y-6 relative">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Samples" }]}
        title="Samples"
        description="Manage every sample in the lab — registration to delivery."
        actions={
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted cursor-pointer transition font-semibold"
            >
              <Upload className="size-3.5" /> Import
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted cursor-pointer transition font-semibold"
            >
              <Download className="size-3.5" /> Export
            </button>
            <Link
              to="/app/intake"
              className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white font-medium hover:opacity-90 shadow-sm transition cursor-pointer"
            >
              <Plus className="size-3.5" /> Register
            </Link>
          </>
        }
      />

      {/* Advanced Filters Drawer Panel */}
      {showAdvancedFilters && (
        <div className="rounded-xl border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in slide-in-from-top duration-300">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Priority SLA
            </label>
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="mt-1.5 w-full rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Rush">Rush</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sample Prep Matrix Type
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="mt-1.5 w-full rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            >
              <option value="All">All Types</option>
              <option value="Core Split">Core Split</option>
              <option value="Drill Core">Drill Core</option>
              <option value="Rock Pulp">Rock Pulp</option>
              <option value="Sulphide">Sulphide</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatus("All");
                setFilterPriority("All");
                setFilterType("All");
                setQ("");
                setCurrentPage(1);
                toast.info("Active LIMS filters cleared.");
              }}
              className="w-full rounded border border-border bg-background py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              Reset Advanced Filters
            </button>
          </div>
        </div>
      )}

      {fetchError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive shadow-sm my-4 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-sm font-semibold">LIMS Database Connection Failure</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">{fetchError}</p>
          <button
            type="button"
            onClick={() => setReloadTrigger((prev) => prev + 1)}
            className="mt-4 rounded-md bg-destructive px-3.5 py-1.5 text-xs text-white font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Retry Fetch
          </button>
        </div>
      ) : isLoadingData && serverTotalCount === null ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
          <p className="text-sm font-medium">Fetching verified specimens from UniPod LIMS...</p>
        </div>
      ) : (
        <div className="relative">
          {isLoadingData && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          <DataTable
            data={paginatedData}
            headers={headers}
            renderRow={renderRow}
            searchQuery={q}
            onSearchChange={(val) => {
              setQ(val);
              setCurrentPage(1);
            }}
            searchPlaceholder="Search by ID, client or project…"
            filters={filtersSlot}
            pagination={{
              currentPage,
              totalPages: totalPages || 1,
              onPageChange: setCurrentPage,
            }}
            totalCount={serverTotalCount !== null ? serverTotalCount : samples.length}
            filteredCount={serverTotalCount !== null ? serverTotalCount : filtered.length}
          />
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border border-primary/20 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom duration-300">
          <span className="text-xs font-semibold text-foreground">
            Selected <span className="text-primary font-bold">{selectedIds.length}</span> samples
          </span>
          <div className="h-4 w-px bg-border" />
          <form onSubmit={handleBulkStatusSubmit} className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-md border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
              required
            >
              <option value="">-- Batch Update Status --</option>
              {SAMPLE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isBulkUpdating}
              className="inline-flex items-center gap-1 rounded-md gradient-primary px-3 py-1.5 text-xs text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm transition disabled:opacity-55"
            >
              {isBulkUpdating ? (
                <RefreshCw className="size-3 animate-spin" />
              ) : (
                <CheckCircle className="size-3" />
              )}{" "}
              Apply
            </button>
          </form>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={() => {
              const selectedSamples = samples.filter((s) => selectedIds.includes(s.id));
              if (selectedSamples.length === 0) return;

              const printWindow = window.open("", "_blank");
              if (printWindow) {
                const labelsHtml = selectedSamples
                  .map(
                    (s) => `
                  <div class="label-page">
                    <div class="label-container">
                      <h2 style="margin: 0 0 5px 0; font-size: 16px; letter-spacing: 1px;">GEOChem LIMS Tag</h2>
                      <div class="barcode-box">
                        ${generateCode39Svg(s.id)}
                      </div>
                      <h3 style="margin: 5px 0; font-size: 18px; font-weight: bold; font-family: monospace;">ID: ${s.id}</h3>
                      <p style="margin: 3px 0; font-size: 12px; font-weight: bold;">Client: ${s.client}</p>
                      <p style="margin: 3px 0; font-size: 12px; font-weight: bold;">Matrix: ${s.matrix || s.type}</p>
                      <p style="margin: 3px 0; font-size: 11px; font-family: monospace; color: #555;">Shelf: ${s.location}</p>
                    </div>
                  </div>
                `,
                  )
                  .join("");

                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Batch Print LIMS Labels</title>
                      <style>
                        body {
                          margin: 0;
                          padding: 0;
                          background: #fff;
                          color: #000;
                          font-family: 'Courier New', Courier, monospace;
                        }
                        .print-controls {
                          position: fixed;
                          bottom: 20px;
                          right: 20px;
                          z-index: 100;
                        }
                        button {
                          padding: 10px 24px;
                          font-weight: bold;
                          font-size: 14px;
                          cursor: pointer;
                          border: 2px solid #000;
                          background: #000;
                          color: #fff;
                          border-radius: 6px;
                          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        }
                        button:hover {
                          background: #fff;
                          color: #000;
                        }
                        .label-page {
                          page-break-after: always;
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                          height: 100vh;
                          width: 100%;
                          box-sizing: border-box;
                          padding: 20px;
                        }
                        .label-container {
                          border: 4px solid #000;
                          padding: 20px;
                          border-radius: 12px;
                          text-align: center;
                          width: 360px;
                          box-sizing: border-box;
                        }
                        .barcode-box {
                          width: 100%;
                          height: 100px;
                          margin: 10px 0;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        }
                        .barcode-box svg {
                          max-width: 100%;
                          max-height: 100%;
                        }
                        @media print {
                          .print-controls { display: none !important; }
                          body { background: #fff !important; }
                          .label-page { height: 100vh !important; }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="print-controls">
                        <button onclick="window.print()">Print Batch Labels (${selectedSamples.length})</button>
                      </div>
                      \${labelsHtml}
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }
              toast.success(`Generated batch tags for ${selectedSamples.length} samples.`);
              setSelectedIds([]);
            }}
            className="rounded border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted transition cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Batch Labels
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="rounded p-1 hover:bg-muted transition cursor-pointer text-muted-foreground hover:text-foreground"
            title="Clear selections"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Barcode Scanner Simulator Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleScanSubmit}
            className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-foreground inline-flex items-center gap-1.5">
                <ScanBarcode className="size-5 text-primary animate-pulse" /> Barcode Reader Scanner
              </h3>
              <button
                type="button"
                onClick={() => setShowScanModal(false)}
                className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scan Mode Selection tabs */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Scanning Mode Behavior
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-muted/60 border border-border/40">
                {(["lookup", "transit", "transition"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setScanMode(mode)}
                    className={`rounded py-1.5 text-[10px] font-bold transition cursor-pointer text-center ${
                      scanMode === mode
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode === "lookup"
                      ? "Quick Lookup"
                      : mode === "transit"
                        ? "Log Transit"
                        : "Transition"}
                  </button>
                ))}
              </div>
            </div>

            {/* Context-Sensitive Mode Inputs */}
            {scanMode === "transit" && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Assigned Station Location
                </label>
                <select
                  value={transitLocation}
                  onChange={(e) => setTransitLocation(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-semibold"
                >
                  <option value="Prep Bench">Prep Bench</option>
                  <option value="QA Lab">QA Lab</option>
                  <option value="Vault Shelf">Vault Shelf</option>
                  <option value="Inbound Bin">Inbound Bin</option>
                  <option value="Outbound Dock">Outbound Dock</option>
                </select>
              </div>
            )}

            {scanMode === "transition" && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Transition to Workflow Step
                </label>
                <select
                  value={targetTransitionStatus}
                  onChange={(e) => setTargetTransitionStatus(e.target.value as SampleStatus)}
                  className="w-full rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-semibold"
                >
                  {SAMPLE_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Laser Reader Input Stream
                </label>
                <span className="text-[10px] text-muted-foreground/60 italic font-medium">
                  Hardware-sanitized wedge
                </span>
              </div>
              <input
                type="text"
                value={scanQuery}
                onChange={(e) => setScanQuery(e.target.value)}
                placeholder="Scan tag or type ID (e.g. *GCS-24004*)"
                className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-semibold tracking-wider font-mono text-center text-primary"
                required
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowScanModal(false)}
                className="rounded border border-border bg-background px-3.5 py-1.5 text-xs font-semibold hover:bg-muted cursor-pointer transition text-muted-foreground hover:text-foreground"
              >
                Close Scanner
              </button>
              <button
                type="submit"
                className="rounded-md gradient-primary text-white px-4 py-1.5 text-xs font-semibold hover:opacity-90 shadow-sm cursor-pointer transition"
              >
                {scanMode === "lookup"
                  ? "Open Record"
                  : scanMode === "transit"
                    ? "Log Custody Transit"
                    : "Verify Transition"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Premium Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-foreground inline-flex items-center gap-1.5">
                <Download className="size-5 text-primary" /> Export Records Panel
              </h3>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* 1. Format Selection */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  File Format
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["csv", "excel", "pdf"] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setExportFormat(format)}
                      className={`rounded px-3 py-2 text-xs font-semibold border transition cursor-pointer text-center ${
                        exportFormat === format
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {format === "csv"
                        ? "CSV Table"
                        : format === "excel"
                          ? "MS Excel"
                          : "PDF Report"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Scope Selection */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Export Scope
                </label>
                <div className="mt-2 space-y-2">
                  <label
                    className={`flex items-center justify-between rounded-lg border p-3 text-xs cursor-pointer select-none font-medium transition ${
                      selectedIds.length === 0
                        ? "opacity-45 cursor-not-allowed border-border"
                        : exportScope === "selected"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="scope"
                        checked={exportScope === "selected"}
                        disabled={selectedIds.length === 0}
                        onChange={() => setExportScope("selected")}
                        className="text-primary focus:ring-primary"
                      />
                      <span>Selected Records</span>
                    </div>
                    <span className="font-mono bg-muted px-2 py-0.5 rounded font-bold">
                      {selectedIds.length} rows
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between rounded-lg border p-3 text-xs cursor-pointer select-none font-medium transition ${
                      exportScope === "filtered"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="scope"
                        checked={exportScope === "filtered"}
                        onChange={() => setExportScope("filtered")}
                        className="text-primary focus:ring-primary"
                      />
                      <span>Filtered Data Grid</span>
                    </div>
                    <span className="font-mono bg-muted px-2 py-0.5 rounded font-bold">
                      {filtered.length} rows
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between rounded-lg border p-3 text-xs cursor-pointer select-none font-medium transition ${
                      exportScope === "all"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="scope"
                        checked={exportScope === "all"}
                        onChange={() => setExportScope("all")}
                        className="text-primary focus:ring-primary"
                      />
                      <span>Entire LIMS Inventory</span>
                    </div>
                    <span className="font-mono bg-muted px-2 py-0.5 rounded font-bold">
                      {samples.length} rows
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="rounded border border-border bg-background px-3.5 py-2 text-xs font-semibold hover:bg-muted cursor-pointer transition text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteExport}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 rounded-md gradient-primary text-white px-4 py-2 text-xs font-semibold hover:opacity-90 shadow-sm cursor-pointer transition disabled:opacity-50"
              >
                {isExporting ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}{" "}
                Compile Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
