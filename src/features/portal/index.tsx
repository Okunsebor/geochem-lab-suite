import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Beaker, Clock, CheckCircle2, FileText, ArrowRight, Check, LifeBuoy, Download, X, Package, LayoutList, History } from "lucide-react";
import { useLimsState } from "../../hooks/use-lims-state";
import { generateCode39Svg } from "../../lib/barcode-utils";
import { StatCard } from "../../components/shared/StatCard";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { SAMPLE_STATUSES } from "../../types";
import { InputField, TextAreaField, SelectField } from "../../components/shared/form-controls";
import { toast } from "sonner";
import { Priority } from "../../types";
import { Portal3DCard } from "@/components/portal/Portal3DScene";

// 1. Customer Dashboard Feature
export function PortalDashboardFeature() {
  const { samples, reports, downloadReportPdf, currentUser } = useLimsState();
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const tenantClient = currentUser?.organization || "Auric Mining Ltd";

  // Filter samples that belong to the customer's firm
  const mine = samples.filter((s) => s.client === tenantClient).slice(0, 8);
  const activeCount = samples.filter((s) => s.client === tenantClient && s.status !== "Completed" && s.status !== "Report Ready").length;
  const readyReports = reports.filter((r) => r.client === tenantClient && r.status === "Approved").length;
  const selectedSample = samples.find(s => s.id === selectedSampleId);

  return (
    <div className="space-y-6">
      <Portal3DCard className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-xl p-6 shadow-xl">
        <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-accent">Registered customer</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-display mt-1">
          Welcome back, {currentUser?.name?.split(" ")[0] || "Client"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tenantClient} · {activeCount} active samples in the UniPod GeoChem pipeline
        </p>
      </Portal3DCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Samples", value: activeCount.toString(), delta: "+3", icon: <Beaker className="size-4" /> },
          { label: "Avg Turnaround", value: "3.4d", delta: "-0.6d", icon: <Clock className="size-4" /> },
          { label: "Ready to Download", value: readyReports.toString(), icon: <CheckCircle2 className="size-4" /> },
          { label: "Reports YTD", value: "86", icon: <FileText className="size-4" /> },
        ].map((stat, i) => (
          <Portal3DCard key={stat.label} delay={i * 0.06}>
            <StatCard label={stat.label} value={stat.value} delta={stat.delta} icon={stat.icon} />
          </Portal3DCard>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Portal3DCard className="lg:col-span-2 rounded-xl border border-border bg-card/90 backdrop-blur-md" delay={0.15}>
        <div className="rounded-xl overflow-hidden h-full">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between bg-card">
            <h3 className="text-sm font-semibold text-foreground">My Samples</h3>
            <Link
              to="/portal/submit"
              className="text-xs text-primary inline-flex items-center gap-1 hover:underline font-semibold cursor-pointer"
            >
              Submit new <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {mine.map((s) => {
              const idx = SAMPLE_STATUSES.indexOf(s.status as any);
              return (
                <div key={s.id} className="p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedSampleId(s.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs text-primary font-medium hover:underline">{s.id}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{s.project}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    {SAMPLE_STATUSES.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${i <= idx ? "gradient-primary" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </Portal3DCard>

        <Portal3DCard className="rounded-xl border border-border bg-card/90 backdrop-blur-md p-5 h-fit" delay={0.2}>
        <div className="h-full">
          <h3 className="text-sm font-semibold text-foreground">Ready to download</h3>
          <ul className="mt-3 space-y-2 max-h-[350px] overflow-y-auto">
            {reports
              .filter((r) => r.client === tenantClient && r.status === "Approved")
              .map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded border border-border p-2.5 text-xs bg-card">
                  <div>
                    <p className="font-mono text-primary font-semibold">{r.id}</p>
                    <p className="text-muted-foreground mt-0.5 font-medium">{r.pages} pages · Certified</p>
                  </div>
                  <button
                    onClick={() => {
                      toast.loading(`Compiling PDF for ${r.id}...`);
                      downloadReportPdf(r.id);
                      toast.dismiss();
                      toast.success(`PDF downloaded for ${r.id}`);
                    }}
                    className="rounded-md gradient-primary px-2.5 py-1 text-xs text-white font-semibold cursor-pointer hover:opacity-90 transition"
                  >
                    Download
                  </button>
                </li>
              ))}
            {readyReports === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4 font-medium">No certificates pending download</p>
            )}
          </ul>
        </div>
        </Portal3DCard>
      </div>

      {/* Sample Tracking Drawer */}
      {selectedSample && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Package className="size-5 text-primary" />
                  {selectedSample.id}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Project: {selectedSample.project}</p>
              </div>
              <button onClick={() => setSelectedSampleId(null)} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition cursor-pointer">
                <X className="size-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Status Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <LayoutList className="size-4" /> Workflow Progress
                </h3>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {SAMPLE_STATUSES.map((status, index) => {
                    const currentIndex = SAMPLE_STATUSES.indexOf(selectedSample.status as any);
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    
                    return (
                      <div key={status} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10 ${
                          isCompleted ? "border-primary bg-primary text-primary-foreground" :
                          isCurrent ? "border-primary bg-card text-primary" : "border-border bg-card text-muted-foreground"
                        }`}>
                          {isCompleted ? <Check className="size-3" /> : <div className={`size-1.5 rounded-full ${isCurrent ? 'bg-primary' : 'bg-transparent'}`} />}
                        </div>
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)]">
                          <div className={`p-3 rounded-lg border ${isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-card'} shadow-sm`}>
                            <p className={`text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-foreground'}`}>{status}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {isCompleted ? "Completed" : isCurrent ? "In Progress" : "Pending"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custody Log */}
              {selectedSample.custody && selectedSample.custody.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <History className="size-4" /> Activity History
                  </h3>
                  <div className="space-y-3">
                    {selectedSample.custody.map((log, i) => (
                      <div key={i} className="text-xs border-l-2 border-primary/30 pl-3 py-1">
                        <p className="font-medium text-foreground">{log.action}</p>
                        <p className="text-muted-foreground mt-0.5">{new Date(log.time).toLocaleString()} · {log.technician}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Barcode Footer */}
            <div className="p-6 border-t border-border bg-muted/20 flex flex-col items-center">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Sample ID Barcode</p>
              <div 
                className="h-16 w-full max-w-[250px] text-foreground"
                dangerouslySetInnerHTML={{ __html: generateCode39Svg(selectedSample.id) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Portal Submit Sample Feature
export function PortalSubmitFeature() {
  const { registerSample, currentUser } = useLimsState();
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    project: "Drillhole AX-205",
    type: "Drill Core",
    weight: "1.50",
    matrix: "Sulphide",
    specialInstructions: "Handle with high confidentiality.",
  });
  const [priority, setPriority] = useState<Priority>("Normal");

  const tenantClient = currentUser?.organization || "Auric Mining Ltd";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const registered = registerSample({
      client: tenantClient,
      project: formData.project,
      type: formData.type,
      weight: formData.weight,
      priority: priority,
      location: "Inbound Bin",
      matrix: formData.matrix,
      container: "Poly Envelope",
      receivedFrom: currentUser?.name ? `${currentUser.name} (Portal)` : "Jane Chen (Portal)",
      specialInstructions: formData.specialInstructions,
    });

    toast.success(`Analytical job successfully ordered! Allocated LIMS ID: ${registered.id}`);
    setSubmittedId(registered.id);
  };

  if (submittedId) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto mt-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Submission Confirmed</h1>
        <p className="text-muted-foreground mt-2">
          Your sample has been pre-registered. Please print the barcode below and attach it to your physical shipment.
        </p>

        <div className="mt-8 p-8 border border-border rounded-xl bg-card inline-block text-left shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">Pre-Registration Barcode</p>
          <div 
            className="h-24 w-full min-w-[300px] text-foreground mx-auto"
            dangerouslySetInnerHTML={{ __html: generateCode39Svg(submittedId) }}
          />
          <div className="mt-6 flex justify-center">
            <button 
              className="rounded border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted transition cursor-pointer" 
              onClick={() => {
                const barcodeWindow = window.open("", "_blank");
                if (barcodeWindow) {
                  barcodeWindow.document.write(`
                    <html>
                      <head>
                        <title>Print Label ${submittedId}</title>
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
                            ${generateCode39Svg(submittedId)}
                          </div>
                          <h3 style="margin: 5px 0; font-size: 20px; font-weight: bold; font-family: monospace;">ID: ${submittedId}</h3>
                          <p style="margin: 4px 0; font-size: 13px; font-weight: bold;">Client: ${tenantClient}</p>
                          <p style="margin: 4px 0; font-size: 13px; font-weight: bold;">Project: ${formData.project}</p>
                          <button onclick="window.print()">Print Label Tag</button>
                        </div>
                      </body>
                    </html>
                  `);
                  barcodeWindow.document.close();
                }
              }}
            >
              Print Label
            </button>
          </div>
        </div>

        <div className="mt-8">
          <button 
            onClick={() => {
              setSubmittedId(null);
              setFormData(prev => ({ ...prev, weight: "" }));
            }} 
            className="text-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            Submit Another Sample
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Submit Analytical Job</h1>
        <p className="text-sm text-muted-foreground mt-1">Order test requests and pre-register barcodes.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-5 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <InputField label="Firm" defaultValue={tenantClient} disabled />
          <InputField label="Project Reference" name="project" value={formData.project} onChange={handleChange} required />
          <InputField label="Sample Type" name="type" value={formData.type} onChange={handleChange} required />
          <InputField label="Estimated Matrix Type" name="matrix" value={formData.matrix} onChange={handleChange} />
          <InputField label="Weight (kg)" name="weight" type="number" step="0.1" value={formData.weight} onChange={handleChange} required />
          
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">Requested Finish Analysis</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Au Finish (FA-AAS)", "ICP-MS 51-element", "XRF Oxide Matrix", "Aqua Regia finish"].map((t, i) => (
                <label
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1 text-xs cursor-pointer hover:bg-muted select-none"
                >
                  <input type="checkbox" defaultChecked={i === 0} className="rounded border-input text-primary" />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">Priority SLA</label>
            <div className="mt-1 flex gap-2">
              {(["Low", "Normal", "High", "Rush"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                    priority === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <TextAreaField
              label="Special Instructions / Shipping comments"
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
          <Link
            to="/portal"
            className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-4 py-2 text-sm text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm transition"
          >
            <Check className="size-3.5" /> Submit Order
          </button>
        </div>
      </form>
    </div>
  );
}

// 3. Portal Reports Table Feature
export function PortalReportsFeature() {
  const { reports, downloadReportPdf, currentUser } = useLimsState();
  const tenantClient = currentUser?.organization || "Auric Mining Ltd";
  const mine = reports.filter((r) => r.client === tenantClient);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">My Reports</h1>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-left [&>th]:font-semibold border-b border-border">
                <th>Report</th>
                <th>Sample</th>
                <th>Pages</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mine.map((r) => (
                <tr key={r.id} className="border-t border-border [&>td]:px-4 [&>td]:py-2.5 font-medium transition-colors hover:bg-muted/10">
                  <td className="font-mono text-xs text-primary">{r.id}</td>
                  <td className="font-mono text-xs">{r.sample}</td>
                  <td className="text-muted-foreground">{r.pages}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => {
                        toast.loading(`Compiling PDF for ${r.id}...`);
                        downloadReportPdf(r.id);
                        toast.dismiss();
                        toast.success(`PDF downloaded for ${r.id}`);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold cursor-pointer"
                    >
                      <Download className="size-3" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
              {mine.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-medium">
                    No reports ready
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 4. Portal Notifications List Feature
export function PortalNotificationsFeature() {
  const { notifications } = useLimsState();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
      <ul className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {notifications.map((n) => (
          <li key={n.id} className="p-4 text-sm hover:bg-muted/10 transition-colors">
            <p className="font-medium text-foreground">{n.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-semibold">{n.time} ago</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 5. Portal Support Ticket Feature
export function PortalSupportFeature() {
  const { tickets, addSupportTicket } = useLimsState();
  const [formData, setFormData] = useState({
    subject: "",
    priority: "Medium",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) return;

    const ticketId = `GCS-HELP-${Math.floor(9840 + Math.random() * 100)}`;
    addSupportTicket({
      id: ticketId,
      subject: formData.subject,
      priority: formData.priority,
      message: formData.message,
      status: "Open",
      createdAt: new Date().toISOString(),
    });

    toast.success(`Support ticket created successfully! Ticket ID: ${ticketId}`);
    setFormData({ subject: "", priority: "Medium", message: "" });
  };

  const defaultTickets = [
    { id: "GCS-HELP-9811", subject: "Rerun request on GCS-24004", status: "Resolved" },
    { id: "GCS-HELP-9721", subject: "LIMS API access token setup", status: "Open" },
  ];

  const allTickets = [...tickets, ...defaultTickets];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Customer Support & Inquiries</h1>
        <p className="text-sm text-muted-foreground mt-1">Submit technical questions or request analytical reruns.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold inline-flex items-center gap-2 text-foreground">
            <LifeBuoy className="size-5 text-primary" /> Create Support Request
          </h2>
          
          <InputField
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
            placeholder="Analytical query on Au duplicates standard deviations..."
            required
          />
          
          <SelectField
            label="Urgency SLA"
            value={formData.priority}
            onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
            options={[
              { label: "Low (General query)", value: "Low" },
              { label: "Medium (Sample turnaround inquiry)", value: "Medium" },
              { label: "High (Rerun requests / CRM specs flags)", value: "High" },
            ]}
          />
          
          <TextAreaField
            label="Message"
            value={formData.message}
            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="Detail your request, referencing sample IDs..."
            required
          />
          
          <div className="flex justify-end pt-2">
            <button className="rounded-md gradient-primary px-4 py-2 text-sm text-white font-semibold cursor-pointer hover:opacity-90 transition">
              Create Ticket
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-border bg-card p-5 h-fit space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Tickets</h3>
          <ul className="space-y-2 text-xs">
            {allTickets.map((t) => (
              <li key={t.id} className="rounded border border-border p-2.5 bg-card flex justify-between items-center font-medium">
                <div>
                  <p className="font-semibold text-foreground">{t.subject}</p>
                  <p className="text-muted-foreground mt-0.5 font-mono">{t.id}</p>
                </div>
                <StatusBadge status={t.status === "Open" ? "Pending Approval" : "Completed"} />
              </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
