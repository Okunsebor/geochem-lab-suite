import React, { useState } from "react";
import { 
  Download, Eye, FileText, Check, X, Mail, FileCheck2, Clock, Send, Search, AlertCircle, Activity
} from "lucide-react";
import { useLimsState } from "../../hooks/use-lims-state";
import { PageHeader } from "../../components/lims/page-header";
import { StatusBadge } from "../../components/lims/status-badge";
import { toast } from "sonner";
import { AnalyticalReport } from "../../types";

export function ReportsFeature() {
  const { 
    reports, 
    samples, 
    generateReport, 
    approveReport, 
    rejectReport, 
    deliverReport, 
    downloadReportPdf 
  } = useLimsState();

  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("All");

  // Modals state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isDeliverOpen, setIsDeliverOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [deliverEmail, setDeliverEmail] = useState("");
  const [isCompileOpen, setIsCompileOpen] = useState(false);
  const [selectedSampleForReport, setSelectedSampleForReport] = useState("");

  // Statistics
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === "Pending Approval").length;
  const approvedCount = reports.filter((r) => r.status === "Approved").length;
  const deliveredCount = reports.filter((r) => r.status === "Delivered").length;

  // Active report selection
  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  // Eligible samples for compilation (completed samples that don't have a report yet)
  const compileEligibleSamples = samples.filter(
    (s) => s.status === "Completed" && !reports.some((r) => r.sample === s.id)
  );

  const handleApprove = async (id: string) => {
    try {
      await approveReport(id, "Report approved and digital signature applied.");
      toast.success(`Report ${id} signed and certified successfully!`);
    } catch (err) {
      toast.error("Failed to approve report.");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectComment.trim()) {
      toast.error("Rejection comment is required.");
      return;
    }
    try {
      await rejectReport(activeReport.id, rejectComment);
      toast.warning(`Report ${activeReport.id} rejected and returned to draft/revised status.`);
      setIsRejectOpen(false);
      setRejectComment("");
    } catch (err) {
      toast.error("Failed to reject report.");
    }
  };

  const handleDeliverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverEmail.trim()) {
      toast.error("Recipient email is required.");
      return;
    }
    try {
      await deliverReport(activeReport.id, deliverEmail);
      toast.success(`Report ${activeReport.id} successfully delivered to ${deliverEmail}!`);
      setIsDeliverOpen(false);
      setDeliverEmail("");
    } catch (err) {
      toast.error("Failed to deliver report.");
    }
  };

  const handleCompileReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSampleForReport) {
      toast.error("Please select a sample.");
      return;
    }
    try {
      toast.loading(`Compiling analytical results for ${selectedSampleForReport}...`);
      await generateReport(selectedSampleForReport);
      toast.dismiss();
      toast.success(`Report compiled successfully for sample ${selectedSampleForReport}!`);
      setIsCompileOpen(false);
      setSelectedSampleForReport("");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to compile report.");
    }
  };

  // Find sample info for preview
  const previewSample = activeReport ? samples.find((s) => s.id === activeReport.sample) : null;
  const previewResults = previewSample?.results || [
    { element: "Au", value: "2.41", unit: "g/t", method: "FA-AAS", qa: "Pass" },
    { element: "Ag", value: "18.2", unit: "g/t", method: "ICP-MS", qa: "Pass" },
    { element: "Cu", value: "1.24", unit: "%", method: "ICP-OES", qa: "Pass" },
    { element: "Pb", value: "0.34", unit: "%", method: "ICP-OES", qa: "Pass" },
  ];

  // Filtering reports
  const filteredReports = reports.filter((r) => {
    const statusMatch = filterStatus === "All" || 
      (filterStatus === "Pending" ? r.status === "Pending Approval" : r.status === filterStatus);
    
    const queryMatch = searchQuery === "All" || 
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.sample.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.client.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && queryMatch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Reports" }]}
        title="Reports & Certifications"
        description="Generate, review, digitally sign, and securely deliver analytical reports."
        actions={
          <button
            onClick={() => setIsCompileOpen(true)}
            className="rounded-md gradient-primary px-4 py-2 text-sm text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm transition flex items-center gap-1.5"
          >
            <FileText className="size-4" /> Compile Report
          </button>
        }
      />

      {/* Live KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Reports</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalCount}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <FileText className="size-5" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Awaiting Sign-off</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1">{pendingCount}</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-500">
            <Clock className="size-5" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Approved & Signed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500 mt-1">{approvedCount}</p>
          </div>
          <div className="rounded-lg bg-green-500/10 p-2.5 text-green-500">
            <FileCheck2 className="size-5" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Delivered</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-500 mt-1">{deliveredCount}</p>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-500">
            <Send className="size-5" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Reports Directory */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <div className="border-b border-border px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card">
            <h3 className="text-sm font-semibold text-foreground">Assay Report Repository</h3>
            
            {/* Filtering Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search ref/sample/client..."
                  value={searchQuery === "All" ? "" : searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value || "All")}
                  className="rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-44"
                />
              </div>
              <div className="flex gap-1 rounded-md border border-border bg-background p-0.5 text-xs">
                {["All", "Pending", "Approved", "Delivered"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterStatus(t)}
                    className={`px-2.5 py-1 rounded cursor-pointer transition font-medium ${
                      filterStatus === t
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/40">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold border-b border-border">
                  <th>Report ID</th>
                  <th>Sample Ref</th>
                  <th>Client</th>
                  <th>Assays</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => {
                      setSelectedReportId(r.id);
                    }}
                    className={`border-b border-border last:border-0 [&>td]:px-4 [&>td]:py-3 font-medium cursor-pointer transition-colors ${
                      selectedReportId === r.id || (!selectedReportId && activeReport?.id === r.id)
                        ? "bg-muted/50"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    <td className="font-mono text-xs text-primary">{r.id}</td>
                    <td className="font-mono text-xs">{r.sample}</td>
                    <td>{r.client}</td>
                    <td className="text-muted-foreground">{r.pages}</td>
                    <td className="text-muted-foreground text-xs">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedReportId(r.id);
                            toast.info(`Viewing preview of ${r.id}`);
                          }}
                          className="rounded p-1 hover:bg-muted cursor-pointer transition"
                          title="Preview"
                        >
                          <Eye className="size-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => {
                            toast.loading(`Generating & exporting PDF for ${r.id}...`);
                            downloadReportPdf(r.id);
                            toast.dismiss();
                            toast.success(`PDF download started for ${r.id}`);
                          }}
                          className="rounded p-1 hover:bg-muted cursor-pointer transition"
                          title="Download"
                        >
                          <Download className="size-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No reports match the active filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* High-Fidelity PDF Preview & Review Card */}
        {activeReport && (
          <div className="rounded-xl border border-border bg-card overflow-hidden h-fit flex flex-col shadow-sm">
            <div className="border-b border-border px-5 py-3 flex items-center justify-between bg-card">
              <h3 className="text-sm font-semibold text-foreground">Interactive Preview · {activeReport.id}</h3>
              <StatusBadge status={activeReport.status} />
            </div>
            
            {/* Styled Sheet of Paper (PDF simulator) */}
            <div className="p-4 bg-muted/30">
              <div className="mx-auto aspect-[3/4.2] w-full max-w-[340px] rounded bg-white shadow-lg p-5 text-[8px] text-slate-800 space-y-3.5 select-none border relative overflow-hidden">
                {/* Header banner */}
                <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                  <div>
                    <h5 className="font-extrabold text-[9px] tracking-wide text-slate-900">GEOCHEM LABS</h5>
                    <p className="text-[6px] text-slate-500">Premium Analysis & LIMS</p>
                  </div>
                  <div className="text-right">
                    <h6 className="font-bold text-[8px] text-slate-850">Certificate of Analysis</h6>
                    <p className="text-[6px] text-slate-500">Ref: {activeReport.id}</p>
                  </div>
                </div>

                {/* Metadata Details */}
                <div className="grid grid-cols-2 gap-3 text-[6px] bg-slate-50 p-2 rounded">
                  <div>
                    <p className="mb-0.5"><span className="text-slate-400 font-medium">Client:</span> <span className="font-semibold">{activeReport.client}</span></p>
                    <p className="mb-0.5"><span className="text-slate-400 font-medium">Sample LIMS:</span> <span className="font-semibold">{activeReport.sample}</span></p>
                    <p><span className="text-slate-400 font-medium">Matrix:</span> {previewSample?.matrix || "Rock/Sulphide"}</p>
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5"><span className="text-slate-400 font-medium">Project:</span> {previewSample?.project || "Exploration A"}</p>
                    <p className="mb-0.5"><span className="text-slate-400 font-medium">Type:</span> {previewSample?.type || "Core Split"}</p>
                    <p><span className="text-slate-400 font-medium">Date:</span> {new Date(activeReport.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {/* Results Table */}
                <div className="space-y-1">
                  <p className="font-bold text-[7px] text-slate-900">Analytical Chemistry Assays</p>
                  <table className="w-full text-left text-[6px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 font-bold">
                        <th className="py-1 px-1">Element</th>
                        <th className="py-1 px-1">Value</th>
                        <th className="py-1 px-1">Unit</th>
                        <th className="py-1 px-1 text-right">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewResults.map((r: any) => (
                        <tr key={r.element} className="border-b border-slate-100">
                          <td className="py-1 px-1 font-semibold">{r.element}</td>
                          <td className="py-1 px-1 font-mono font-bold text-slate-900">{r.value}</td>
                          <td className="py-1 px-1">{r.unit}</td>
                          <td className="py-1 px-1 text-right text-slate-500">{r.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signatories & Stamps */}
                <div className="pt-2 flex items-end justify-between border-t border-slate-100 mt-4">
                  <div className="space-y-1">
                    <p className="italic text-[6px] text-slate-650">
                      Signatory: <span className="font-bold text-slate-900">{activeReport.status === "Approved" || activeReport.status === "Delivered" ? (activeReport.approvedBy || "Adaeze Nwosu ✓") : "Awaiting Sign-off"}</span>
                    </p>
                    {activeReport.status === "Approved" || activeReport.status === "Delivered" ? (
                      <p className="text-[5px] text-green-600 font-semibold bg-green-50 px-1 py-0.5 rounded w-fit">✓ Digitally Signed & Sealed</p>
                    ) : (
                      <p className="text-[5px] text-amber-600 font-semibold bg-amber-50 px-1 py-0.5 rounded w-fit">⚠ Document Draft Only</p>
                    )}
                  </div>
                  
                  {/* Visual Certification stamp watermark */}
                  {(activeReport.status === "Approved" || activeReport.status === "Delivered") ? (
                    <div className="border border-green-600 text-green-600 p-1 text-[5px] font-extrabold rotate-[-6deg] bg-green-50/20 rounded">
                      GEOCHEM LABS<br/>✓ APPROVED & SEALED
                    </div>
                  ) : (
                    <div className="border border-slate-300 text-slate-400 p-1 text-[5px] font-extrabold rotate-[-6deg] bg-slate-50 rounded">
                      UNPUBLISHED<br/>DRAFT
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="border-t border-border p-3 space-y-2 bg-card">
              {activeReport.status === "Pending Approval" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(activeReport.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-xs text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm transition"
                  >
                    <Check className="size-3.5" /> Approve & Sign
                  </button>
                  <button
                    onClick={() => setIsRejectOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition"
                  >
                    <X className="size-3.5" /> Reject / Comment
                  </button>
                </div>
              )}

              {activeReport.status === "Approved" && (
                <button
                  onClick={() => setIsDeliverOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-xs text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm transition"
                >
                  <Send className="size-3.5" /> Deliver Report
                </button>
              )}

              <button
                onClick={() => {
                  toast.loading(`Compiling PDF for ${activeReport.id}...`);
                  downloadReportPdf(activeReport.id);
                  toast.dismiss();
                  toast.success(`Downloaded PDF for ${activeReport.id}`);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                <Download className="size-3.5" /> Download Certified PDF
              </button>

              {/* History Timeline inside preview card */}
              {activeReport.history && activeReport.history.length > 0 && (
                <div className="mt-3 border-t border-border pt-3 space-y-2 text-xs">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Activity className="size-3 text-primary" /> Report Workflow Logs
                  </h4>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {activeReport.history.map((log) => (
                      <div key={log.id} className="relative pl-3 pb-1.5 last:pb-0 border-l border-border/80">
                        <div className="absolute -left-[4.5px] top-1 size-2 rounded-full bg-primary/80 ring-2 ring-background" />
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-foreground">{log.action}</span>
                          <span className="text-[9px] text-muted-foreground font-medium">{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">By {log.performedBy}</p>
                        {log.comments && (
                          <p className="mt-0.5 bg-muted/60 rounded px-1.5 py-0.5 text-muted-foreground italic text-[9px] font-mono leading-relaxed">
                            "{log.comments}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject Comment Dialog Modal */}
      {isRejectOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRejectSubmit} className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground inline-flex items-center gap-1.5">
                <AlertCircle className="size-4 text-red-500" /> Reject Report Draft
              </h3>
              <button type="button" onClick={() => setIsRejectOpen(false)} className="rounded p-1 hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground font-medium">
                Please enter a detailed comment explaining the reason for returning this report to draft status. This note will be recorded in the audit trail.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Rejection Comments / Corrective Action</label>
                <textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="e.g. Copper values appear abnormally low. Please verify calibration standard values on instrument ICP-OES-01."
                  className="w-full min-h-[90px] rounded-md border border-border bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  required
                />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-muted/30 border-t border-border flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsRejectOpen(false)}
                className="rounded border border-border bg-background px-3 py-1.5 font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-red-600 text-white px-3.5 py-1.5 font-semibold hover:bg-red-750 cursor-pointer shadow-sm transition"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delivery Dialog Modal */}
      {isDeliverOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleDeliverSubmit} className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground inline-flex items-center gap-1.5">
                <Send className="size-4 text-primary" /> Deliver Analytical Report
              </h3>
              <button type="button" onClick={() => setIsDeliverOpen(false)} className="rounded p-1 hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground font-medium">
                Deliver report <span className="font-semibold">{activeReport?.id}</span>. This will automatically publish the certified document to the Client Portal and send an email notification with the secure PDF attachment.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Recipient Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <input
                    type="email"
                    value={deliverEmail}
                    onChange={(e) => setDeliverEmail(e.target.value)}
                    placeholder="geologist@auricmining.com"
                    className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-muted/30 border-t border-border flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsDeliverOpen(false)}
                className="rounded border border-border bg-background px-3 py-1.5 font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md gradient-primary text-white px-3.5 py-1.5 font-semibold hover:opacity-90 cursor-pointer shadow-sm transition"
              >
                Send & Deliver
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Compile Report Dialog Modal */}
      {isCompileOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCompileReport} className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground inline-flex items-center gap-1.5">
                <FileText className="size-4 text-primary" /> Compile New Assay Report
              </h3>
              <button type="button" onClick={() => setIsCompileOpen(false)} className="rounded p-1 hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground font-medium">
                Choose a completed analytical sample to compile its results into a certified laboratory report draft.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Completed Samples Queue</label>
                <select
                  value={selectedSampleForReport}
                  onChange={(e) => setSelectedSampleForReport(e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  required
                >
                  <option value="">-- Select Completed Sample --</option>
                  {compileEligibleSamples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} - {s.client} ({s.project})
                    </option>
                  ))}
                </select>
                {compileEligibleSamples.length === 0 && (
                  <p className="text-[10px] text-red-500 font-semibold mt-1">
                    No completed samples awaiting report compilation.
                  </p>
                )}
              </div>
            </div>
            <div className="px-5 py-3.5 bg-muted/30 border-t border-border flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsCompileOpen(false)}
                className="rounded border border-border bg-background px-3 py-1.5 font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={compileEligibleSamples.length === 0}
                className="rounded-md gradient-primary text-white px-3.5 py-1.5 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm transition"
              >
                Compile Draft
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
