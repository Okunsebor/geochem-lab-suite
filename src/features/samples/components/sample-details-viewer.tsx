import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, MessageSquare, Edit3, FileText, QrCode, Check, ShieldCheck, XCircle, Upload, Loader2 } from "lucide-react";
import { useLimsState } from "../../../hooks/use-lims-state";
import { useSampleActions } from "../../../hooks/use-sample-actions";
import { generateQrCodeSvg, generateCode39Svg } from "../../../lib/barcode-utils";
import { PageHeader } from "../../../components/lims/page-header";
import { StatusBadge } from "../../../components/lims/status-badge";
import { SAMPLE_STATUSES } from "../../../types";
import { SampleStatus } from "../../../types";
import { toast } from "sonner";
import { motion } from "framer-motion";
 
export function SampleDetailsViewer({ sampleId }: { sampleId: string }) {
  const { samples, addSampleNote, updateSampleStatus, logBarcodeScan, fetchSampleDetails } = useLimsState();
  const { verify, reject, uploadAttachment } = useSampleActions();
  const [noteText, setNoteText] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  useEffect(() => {
    if (sampleId) {
      fetchSampleDetails(sampleId);
    }
  }, [sampleId]);
  
  // Verification states
  const [verificationNotes, setVerificationNotes] = useState("");
  const [rackLocation, setRackLocation] = useState("Rack A-1");
  const [checkWeight, setCheckWeight] = useState(true);
  const [checkContainer, setCheckContainer] = useState(true);
  const [checkManifest, setCheckManifest] = useState(true);
  
  // Upload states
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const sample = samples.find((s) => s.id === sampleId) ?? samples[0];
  if (!sample) return <div className="p-8 text-center text-muted-foreground">Sample not found</div>;

  const currentIdx = SAMPLE_STATUSES.indexOf(sample.status as any);

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addSampleNote(sample.id, noteText);
    setNoteText("");
    toast.success("Note added successfully");
  };

  const handleStatusChange = (newStatus: SampleStatus) => {
    updateSampleStatus(sample.id, newStatus);
    setIsUpdatingStatus(false);
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleVerify = async () => {
    if (!rackLocation.trim()) {
      toast.error("Please specify a rack/storage assignment location.");
      return;
    }
    const notes = [
      checkWeight ? "✓ Weight verified" : "✗ Weight discrepancy",
      checkContainer ? "✓ Container intact" : "✗ Leaking container",
      checkManifest ? "✓ Manifest matches" : "✗ Manifest mismatch",
      verificationNotes.trim()
    ].filter(Boolean).join(" | ");

    try {
      await verify(sample.id, notes, rackLocation);
      toast.success("Sample successfully accepted & verified!");
    } catch (err: any) {
      toast.error(err.message || "Verification update failed.");
    }
  };

  const handleReject = async () => {
    const reason = verificationNotes.trim() || "Failed physical check during intake verification.";
    try {
      await reject(sample.id, reason);
      toast.warning("Sample flagged and rejected.");
    } catch (err: any) {
      toast.error(err.message || "Rejection update failed.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    toast.loading(`Uploading attachment: ${file.name}...`);
    try {
      await uploadAttachment(sample.id, file);
      toast.dismiss();
      toast.success(`Document uploaded successfully: ${file.name}`);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Attachment upload failed.");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Combine static documents with dynamic DB-driven sample attachments
  const staticDocs = [
    { name: "Intake Form.pdf", filePath: "#", sizeBytes: 154000 },
    { name: "Field Notes.pdf", filePath: "#", sizeBytes: 89000 },
  ];
  
  const dynamicAttachments = (sample.attachments || []).map(a => ({
    name: a.name,
    filePath: a.filePath,
    sizeBytes: a.sizeBytes
  }));

  const allDocuments = [...staticDocs, ...dynamicAttachments];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Samples" }, { label: sample.id }]}
        title={sample.id}
        description={`${sample.client} · ${sample.project}`}
        actions={
          <>
            <Link
              to="/app/samples"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted font-medium cursor-pointer transition"
            >
              <ArrowLeft className="size-3.5" /> Back
            </Link>
            <button
              onClick={() => {
                const barcodeWindow = window.open("", "_blank");
                if (barcodeWindow) {
                  barcodeWindow.document.write(`
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
                            padding: 24px;
                            border-radius: 12px;
                            text-align: center;
                            width: 385px;
                            position: relative;
                          }
                          .barcode-box {
                            width: 100%;
                            height: 120px;
                            margin: 15px 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                          }
                          .barcode-box svg {
                            max-width: 100%;
                            max-height: 100%;
                          }
                          button {
                            margin-top: 20px;
                            padding: 10px 24px;
                            font-weight: bold;
                            font-size: 14px;
                            cursor: pointer;
                            border: 2px solid #000;
                            background: #000;
                            color: #fff;
                            border-radius: 6px;
                          }
                          button:hover {
                            background: #fff;
                            color: #000;
                          }
                          @media print {
                            button { display: none !important; }
                            body { padding: 0 !important; margin: 0 !important; background: #fff !important; }
                            .label-container { border: none !important; margin: 0 !important; width: 100% !important; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="label-container">
                          <h2 style="margin: 0 0 5px 0; font-size: 18px; letter-spacing: 1px;">GEOChem LIMS Label</h2>
                          <div class="barcode-box">
                            ${generateCode39Svg(sample.id)}
                          </div>
                          <h3 style="margin: 5px 0; font-size: 20px; font-weight: bold; font-family: monospace;">ID: ${sample.id}</h3>
                          <p style="margin: 4px 0; font-size: 13px; font-weight: bold;">Client: ${sample.client}</p>
                          <p style="margin: 4px 0; font-size: 13px; font-weight: bold;">Project: ${sample.project}</p>
                          <button onclick="window.print()">Print Label Tag</button>
                        </div>
                      </body>
                    </html>
                  `);
                  barcodeWindow.document.close();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted font-medium cursor-pointer transition"
            >
              <Printer className="size-3.5" /> Print label
            </button>
            <div className="relative">
              <button
                onClick={() => setIsUpdatingStatus(!isUpdatingStatus)}
                className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white font-medium hover:opacity-90 shadow-sm cursor-pointer transition"
              >
                <Edit3 className="size-3.5" /> Update status
              </button>
              
              {isUpdatingStatus && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-popover shadow-md py-1 z-40">
                  {SAMPLE_STATUSES.map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st as SampleStatus)}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-muted font-medium text-foreground transition-colors flex items-center justify-between cursor-pointer"
                    >
                      {st}
                      {sample.status === st && <Check className="size-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        }
      />

      {/* Workflow Tracker */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2.5">
          <h3 className="text-sm font-semibold">Workflow Progress</h3>
          <span className="text-[10px] text-muted-foreground font-semibold tracking-wide bg-muted px-2.5 py-0.5 rounded-full select-none">Click nodes to transition</span>
        </div>
        <ol className="flex flex-wrap md:flex-nowrap items-center w-full gap-y-4 md:gap-y-0 pt-2">
          {SAMPLE_STATUSES.map((st, i) => {
            const done = i <= currentIdx;
            const isActive = sample.status === st;
            return (
              <li
                key={st}
                className={`flex-1 flex items-center min-w-[120px] ${
                  i < SAMPLE_STATUSES.length - 1
                    ? "after:content-[''] after:hidden md:after:block after:flex-1 after:h-0.5 after:mx-2 " +
                      (i < currentIdx ? "after:bg-primary" : "after:bg-border")
                    : ""
                }`}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    updateSampleStatus(sample.id, st as SampleStatus);
                    toast.success(`Transitioned sample custody status to: ${st}`);
                  }}
                  disabled={isActive}
                  className="group flex md:flex-col items-center gap-2 md:gap-1 cursor-pointer focus:outline-none transition-all disabled:cursor-default disabled:opacity-100 select-none text-left md:text-center"
                  title={`Jump to ${st} stage`}
                >
                  <div
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-all shadow-sm relative ${
                      isActive ? "gradient-primary text-white ring-2 ring-primary/40 ring-offset-2 ring-offset-background scale-105" :
                      done ? "bg-primary/20 text-primary border border-primary/30 group-hover:bg-primary/35" : "bg-muted text-muted-foreground border border-border group-hover:bg-muted/80"
                    }`}
                  >
                    {isActive && (
                      <motion.span 
                        className="absolute inset-0 rounded-full bg-primary/25 pointer-events-none"
                        animate={{ scale: [1, 1.45, 1], opacity: [0.65, 0, 0.65] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                      />
                    )}
                    {isActive ? <Check className="size-3 text-white relative z-10" /> : i + 1}
                  </div>
                  <span
                    className={`text-[10px] truncate max-w-[100px] transition-colors ${
                      isActive ? "text-primary font-bold" :
                      done ? "text-foreground font-semibold group-hover:text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {st}
                  </span>
                </motion.button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Advanced Verification / Acceptance-Rejection Panel */}
      {sample.status === "Received" && sample.acceptanceStatus === "Pending" ? (
        <div className="rounded-xl border border-border bg-card p-6 grid md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div>
            <h3 className="text-sm font-bold text-foreground inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Physical Intake Verification
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Check sample compliance before lab ingestion.</p>
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground select-none cursor-pointer hover:text-foreground">
                <input type="checkbox" checked={checkWeight} onChange={(e) => setCheckWeight(e.target.checked)} className="rounded text-primary border-input" />
                Weight matches manifest ({sample.weight})
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground select-none cursor-pointer hover:text-foreground">
                <input type="checkbox" checked={checkContainer} onChange={(e) => setCheckContainer(e.target.checked)} className="rounded text-primary border-input" />
                Container intact (No leaks/contamination)
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground select-none cursor-pointer hover:text-foreground">
                <input type="checkbox" checked={checkManifest} onChange={(e) => setCheckManifest(e.target.checked)} className="rounded text-primary border-input" />
                Correct matrix & type listed
              </label>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-foreground">Storage Assignment</label>
              <input
                type="text"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
                placeholder="Rack A-12"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">Verification Comments</label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Notes on physical check..."
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs min-h-[60px] focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <button
              onClick={handleVerify}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md gradient-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90 shadow-sm cursor-pointer transition"
            >
              <Check className="size-4" /> Accept & Verify Sample
            </button>
            <button
              onClick={handleReject}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm font-semibold hover:bg-destructive/20 cursor-pointer transition"
            >
              <XCircle className="size-4" /> Flag & Reject Sample
            </button>
          </div>
        </div>
      ) : sample.acceptanceStatus === "Rejected" ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 flex items-start gap-3 animate-in fade-in duration-300">
          <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-destructive">Sample Intake Flagged & Rejected</h3>
            <p className="text-xs text-muted-foreground mt-1">This sample failed physical validation and has been isolated.</p>
            <div className="mt-3 text-xs bg-card p-3 rounded border border-destructive/10 font-semibold text-foreground">
              Reason: {sample.rejectionReason || "Failed physical checklist criteria."}
            </div>
          </div>
        </div>
      ) : sample.acceptanceStatus === "Accepted" ? (
        <div className="rounded-xl border border-success/20 bg-success/10 p-5 flex items-start gap-3 animate-in fade-in duration-300">
          <ShieldCheck className="size-5 text-success shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-success">Sample Verified & Accepted</h3>
            <p className="text-xs text-muted-foreground mt-1">Physical conditions match compliance guidelines. Storage successfully assigned.</p>
            {sample.verificationNotes && (
              <div className="mt-3 text-xs bg-card p-3 rounded border border-success/10 font-semibold text-foreground">
                Verification logs: {sample.verificationNotes}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Details */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2.5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Analytical Specifications Matrix</h3>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full select-none">SLA Assigned</span>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                ["Client Entity", sample.client, "text-foreground font-semibold"],
                ["Assigned Campaign", sample.project, "text-foreground font-medium"],
                ["Sample Type Matrix", sample.type, "text-primary font-bold"],
                ["Weight Standard", sample.weight, "font-mono text-foreground font-semibold"],
                ["Storage Shelf Location", sample.location, "font-mono text-foreground font-medium"],
                ["Urgency Priority Level", sample.priority, "font-semibold text-foreground"],
                ["Lead LIMS Analyst", sample.technician, "text-foreground font-semibold"],
                ["Intake Registered", new Date(sample.receivedAt).toLocaleDateString(), "text-muted-foreground font-medium"],
              ].map(([k, v, cnText]) => (
                <div key={k} className="p-2.5 rounded-lg bg-muted/20 border border-border/40 hover:border-border/80 transition-colors">
                  <dt className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{k}</dt>
                  <dd className={`mt-1.5 truncate ${cnText}`} title={String(v)}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Chain of Custody */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Chain of Custody Timeline</h3>
            <ol className="relative ml-3 border-l-2 border-border space-y-4">
              {(sample.custody || []).map((c, i) => (
                <li key={i} className="ml-4 relative">
                  <span className="absolute -left-[22px] top-1 grid size-3 place-items-center rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-sm font-semibold text-foreground">{c.action}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {c.technician} · {c.time}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* Results */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Analytical Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-border">
                  <tr className="[&>th]:px-2 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                    <th>Element</th>
                    <th>Value</th>
                    <th>Unit</th>
                    <th>Method</th>
                    <th>QA</th>
                  </tr>
                </thead>
                <tbody>
                  {(sample.results || []).map((r) => (
                    <tr key={r.element} className="border-b border-border last:border-0 [&>td]:px-2 [&>td]:py-2 font-medium">
                      <td className="font-semibold">{r.element}</td>
                      <td className="font-mono">{r.value}</td>
                      <td className="text-muted-foreground">{r.unit}</td>
                      <td className="text-muted-foreground">{r.method}</td>
                      <td>
                        <StatusBadge status={r.qa === "Pass" ? "Completed" : "Pending Approval"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Real Dynamic scannable Barcode & QR Code Card */}
          <div className="rounded-xl border border-border bg-card p-5 text-center space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Physical Barcode Tag</h3>
            
            <button
              onClick={() => setShowBarcodeModal(true)}
              className="w-full rounded-lg border border-border bg-card/45 p-3 hover:border-primary/40 hover:bg-muted/40 transition group cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-primary flex flex-col items-center gap-3 relative overflow-hidden"
              title="Click to view barcode tracking actions"
            >
              <div 
                className="w-full h-14 text-foreground scale-x-95 transition-transform group-hover:scale-x-100"
                dangerouslySetInnerHTML={{ __html: generateCode39Svg(sample.id) }}
              />
              <div className="w-full border-t border-dashed border-border/80 my-1" />
              <div className="flex items-center justify-between w-full text-xs font-semibold px-1">
                <span className="text-muted-foreground">Type: <span className="text-foreground font-mono">Code 39</span></span>
                <span className="text-primary group-hover:underline flex items-center gap-1">Actions <QrCode className="size-3.5" /></span>
              </div>
            </button>

            <div className="flex items-center gap-2 justify-center text-[10px] font-semibold text-muted-foreground bg-muted/40 py-1.5 px-2.5 rounded border border-border/40 font-mono">
              <span className="inline-block size-2 rounded-full bg-success animate-pulse" />
              Dynamic 2D Matrix Synced
            </div>
          </div>

          {/* Glassmorphic Barcode Actions & Tracking Modal */}
          {showBarcodeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="absolute inset-0 bg-background/45 animate-in fade-in duration-200" onClick={() => setShowBarcodeModal(false)} />
              <div className="relative z-55 w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
                
                {/* Left Side: SVGs & Export Options */}
                <div className="flex-1 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6 space-y-4">
                  <div className="w-full flex items-center justify-between">
                    <h4 className="font-bold text-foreground text-sm">Tag Render Vectors</h4>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-mono font-bold">100% Crisp SVG</span>
                  </div>

                  {/* Code 39 rendering */}
                  <div className="w-full p-4 rounded-lg bg-white text-black flex flex-col items-center justify-center border border-border shadow-inner">
                    <div 
                      className="w-full h-16"
                      dangerouslySetInnerHTML={{ __html: generateCode39Svg(sample.id) }}
                    />
                    <p className="text-[10px] text-muted-foreground font-mono font-bold mt-1">CODE 39 (LINEAR)</p>
                  </div>

                  {/* QR Code rendering */}
                  <div className="size-36 p-3 rounded-lg bg-white text-black flex flex-col items-center justify-center border border-border shadow-inner">
                    <div 
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: generateQrCodeSvg(sample.id) }}
                    />
                    <p className="text-[10px] text-muted-foreground font-mono font-bold mt-0.5">2D DATAMATRIX</p>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generateCode39Svg(sample.id));
                        toast.success("Code 39 SVG copied to clipboard!");
                      }}
                      className="rounded border border-border bg-background py-1.5 text-xs font-semibold hover:bg-muted text-foreground transition cursor-pointer text-center"
                    >
                      Copy Code 39
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generateQrCodeSvg(sample.id));
                        toast.success("QR Code SVG copied to clipboard!");
                      }}
                      className="rounded border border-border bg-background py-1.5 text-xs font-semibold hover:bg-muted text-foreground transition cursor-pointer text-center"
                    >
                      Copy QR Code
                    </button>
                  </div>
                </div>

                {/* Right Side: Custody Scan Tracker & Shortcuts */}
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-base">Barcode Tracking Actions</h3>
                    <button
                      onClick={() => setShowBarcodeModal(false)}
                      className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition"
                    >
                      <XCircle className="size-5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sample ID Reference</span>
                    <p className="text-lg font-mono font-bold text-primary">{sample.id}</p>
                    <p className="text-xs text-muted-foreground font-medium">{sample.client} · {sample.project}</p>
                  </div>

                  <div className="border-t border-border pt-3 space-y-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Verify Custody Scan</span>
                    
                    {/* Dynamic Scan Log Simulator */}
                    <div className="grid grid-cols-3 gap-2">
                      {["Prep Bench", "QA Lab", "Vault Shelf"].map((loc) => (
                        <button
                          key={loc}
                          onClick={() => {
                            logBarcodeScan(sample.id, loc, `Checked in at ${loc}`);
                            toast.success(`Custody scan logged at ${loc}!`);
                          }}
                          className="rounded border border-primary/20 bg-primary/5 hover:bg-primary/10 py-1.5 px-1 text-[10px] font-bold text-primary transition cursor-pointer text-center"
                        >
                          Scan at {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Workflow Status Jump</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Received", "Verified", "In Preparation", "In Analysis", "Completed"].map((st) => (
                        <button
                          key={st}
                          disabled={sample.status === st}
                          onClick={() => {
                            updateSampleStatus(sample.id, st as SampleStatus);
                            toast.success(`Workflow status updated to: ${st}`);
                          }}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition cursor-pointer ${
                            sample.status === st 
                              ? "bg-primary text-white border-primary cursor-default opacity-90"
                              : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 flex gap-2">
                    <button
                      onClick={() => {
                        toast.success("Reprinting thermal barcode label...");
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md gradient-primary px-3 py-2 text-xs font-bold text-white hover:opacity-90 shadow-sm cursor-pointer transition"
                    >
                      <Printer className="size-3.5" /> Dispatch Reprint Tag
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Linked Documents with Real Uploader */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Linked Documents</h3>
            <ul className="space-y-2 text-xs">
              {allDocuments.map((doc, idx) => (
                <li key={idx} className="flex items-center justify-between rounded border border-border p-2 bg-card">
                  <span className="inline-flex items-center gap-2 font-medium truncate max-w-[180px]">
                    <FileText className="size-3.5 text-primary" /> {doc.name}
                  </span>
                  <button
                    onClick={() => {
                      if (doc.filePath === "#") {
                        toast.info(`Viewing ${doc.name} (Sandbox Mock)`);
                      } else {
                        window.open(doc.filePath, "_blank");
                      }
                    }}
                    className="text-primary hover:underline font-semibold cursor-pointer shrink-0"
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="mt-4 pt-3 border-t border-border">
              <label className="w-full inline-flex items-center justify-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-muted transition text-muted-foreground hover:text-foreground select-none">
                {uploadingDoc ? (
                  <>
                    <Loader2 className="size-3 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="size-3" /> Attach document
                  </>
                )}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingDoc}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.csv"
                />
              </label>
            </div>
          </div>

          {/* Dynamic Notes */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold inline-flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" /> Notes
            </h3>
            
            <form onSubmit={handlePostNote} className="mt-3">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note…"
                className="w-full rounded-md border border-input bg-background p-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
                required
              />
              <button
                type="submit"
                className="mt-2 w-full rounded-md gradient-primary px-3 py-1.5 text-xs text-white font-medium cursor-pointer hover:opacity-90 transition"
              >
                Post note
              </button>
            </form>

            {sample.notes && sample.notes.length > 0 && (
              <div className="mt-4 border-t border-border pt-3 space-y-3 max-h-[200px] overflow-y-auto">
                {sample.notes.map((n) => (
                  <div key={n.id} className="text-xs bg-muted/40 p-2.5 rounded border border-border/60">
                    <div className="flex justify-between font-semibold text-foreground mb-1">
                      <span>{n.author}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-normal">{n.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
