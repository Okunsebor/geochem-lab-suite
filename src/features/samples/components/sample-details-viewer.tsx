import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, MessageSquare, Edit3, FileText, QrCode, Check, ShieldCheck, XCircle, Upload, Loader2 } from "lucide-react";
import { useLimsState } from "../../../hooks/use-lims-state";
import { useSampleActions } from "../../../hooks/use-sample-actions";
import { generateQrCodeSvg, generateCode39Svg } from "../../../lib/barcode-utils";
import { PageHeader } from "../../../components/lims/page-header";
import { StatusBadge } from "../../../components/lims/status-badge";
import { SAMPLE_STATUSES } from "../../../lib/mock-data";
import { SampleStatus } from "../../../types";
import { toast } from "sonner";

export function SampleDetailsViewer({ sampleId }: { sampleId: string }) {
  const { samples, addSampleNote, updateSampleStatus } = useLimsState();
  const { verify, reject, uploadAttachment } = useSampleActions();
  const [noteText, setNoteText] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
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
                      <head><title>Print Label ${sample.id}</title></head>
                      <body style="display:flex;flex-direction:column;align-items:center;justify-center;height:100vh;margin:0;font-family:monospace;padding:40px;">
                        <div style="border:3px solid #000;padding:30px;border-radius:10px;text-align:center;width:400px;">
                          <h2>GEOChem LIMS Label</h2>
                          <div style="width:100%;height:150px;margin:20px 0;">
                            ${generateCode39Svg(sample.id)}
                          </div>
                          <h3>ID: ${sample.id}</h3>
                          <p>Client: ${sample.client}</p>
                          <p>Project: ${sample.project}</p>
                          <button onclick="window.print()" style="margin-top:20px;padding:10px 20px;font-weight:bold;cursor:pointer;">Print Label</button>
                        </div>
                      </body>
                    </html>
                  `);
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Workflow Progress</h3>
          <StatusBadge status={sample.status} />
        </div>
        <ol className="flex flex-wrap md:flex-nowrap items-center w-full gap-y-4 md:gap-y-0">
          {SAMPLE_STATUSES.map((st, i) => {
            const done = i <= currentIdx;
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
                <div className="flex md:flex-col items-center gap-2 md:gap-1">
                  <div
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                      done ? "gradient-primary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-[10px] truncate max-w-[100px] ${
                      done ? "text-foreground font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {st}
                  </span>
                </div>
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
            <h3 className="text-sm font-semibold mb-3">Sample Details</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Client", sample.client],
                ["Project", sample.project],
                ["Type", sample.type],
                ["Weight", sample.weight],
                ["Storage", sample.location],
                ["Priority", sample.priority],
                ["Technician", sample.technician],
                ["Received", new Date(sample.receivedAt).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground font-medium">{k}</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{v}</dd>
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
          {/* Real Dynamic scannable QR Code */}
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div 
              className="mx-auto size-32 place-items-center rounded-lg border border-border bg-card p-2 flex items-center justify-center text-foreground shadow-sm"
              dangerouslySetInnerHTML={{ __html: generateQrCodeSvg(sample.id) }} 
            />
            <p className="mt-3 text-xs text-muted-foreground font-mono">{sample.id}</p>
            <button
              onClick={() => toast.success("Label sent to Zebra QLn420 printer")}
              className="mt-3 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted font-medium cursor-pointer transition"
            >
              Reprint barcode
            </button>
          </div>

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
