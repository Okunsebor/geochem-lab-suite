import React, { useState } from "react";
import { ScanBarcode, Upload, Check } from "lucide-react";
import { useSampleActions } from "../../../hooks/use-sample-actions";
import { generateQrCodeSvg } from "../../../lib/barcode-utils";
import { supabaseHelpers } from "../../../lib/supabase";
import { PageHeader } from "../../../components/lims/page-header";
import { InputField, TextAreaField } from "../../../components/shared/form-controls";
import { toast } from "sonner";
import { Priority } from "../../../types";

export function IntakeFormFeature() {
  const { register } = useSampleActions();
  const [formData, setFormData] = useState({
    client: "Auric Mining Ltd",
    project: "Drillhole AX-204",
    type: "Drill Core",
    matrix: "Sulphide",
    weight: "1.42",
    container: "Calico Bag",
    receivedFrom: "Field Tech A. Vargas",
    dateReceived: new Date().toISOString().split("T")[0],
    specialInstructions: "Handle as rush — confidential project.",
  });
  const [priority, setPriority] = useState<Priority>("Normal");
  const [generateBarcode, setGenerateBarcode] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const registered = await register({
        client: formData.client,
        project: formData.project,
        type: formData.type,
        weight: formData.weight,
        priority: priority,
        location: "Rack A-1",
        matrix: formData.matrix,
        container: formData.container,
        receivedFrom: formData.receivedFrom,
        specialInstructions: formData.specialInstructions,
      });

      toast.success(`Sample registered successfully with ID: ${registered.id}`);
      
      if (generateBarcode) {
        toast.info("Generating secure QR barcode label...");
        const qrSvg = generateQrCodeSvg(registered.id);
        const qrBlob = new Blob([qrSvg], { type: "image/svg+xml" });
        try {
          await supabaseHelpers.uploadBarcodeSvg(registered.id, qrBlob);
          toast.success(`Secure QR barcode generated & registered: ${registered.id}`);
        } catch (uploadErr) {
          console.warn("Bypassed remote QR registration:", uploadErr);
        }
      }

      // Reset weights
      setFormData((prev) => ({ ...prev, weight: "" }));
    } catch (err: any) {
      toast.error(err.message || "Failed to register sample.");
    }
  };

  const handleBulkCSV = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    toast.success("CSV file validated and 42 samples imported (Mock)");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Sample Intake" }]}
        title="Sample Intake"
        description="Register new samples — single entry or bulk import."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <InputField
              label="Client"
              name="client"
              value={formData.client}
              onChange={handleChange}
              required
            />
            <InputField
              label="Project"
              name="project"
              value={formData.project}
              onChange={handleChange}
              required
            />
            <InputField
              label="Sample Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            />
            <InputField
              label="Matrix"
              name="matrix"
              value={formData.matrix}
              onChange={handleChange}
            />
            <InputField
              label="Sample Weight (kg)"
              name="weight"
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={handleChange}
              required
            />
            <InputField
              label="Container"
              name="container"
              value={formData.container}
              onChange={handleChange}
            />
            <InputField
              label="Received From"
              name="receivedFrom"
              value={formData.receivedFrom}
              onChange={handleChange}
            />
            <InputField
              label="Date Received"
              name="dateReceived"
              type="date"
              value={formData.dateReceived}
              onChange={handleChange}
            />
            
            <div className="sm:col-span-2">
              <label className="text-xs font-medium">Priority Level</label>
              <div className="mt-1 flex gap-2">
                {(["Low", "Normal", "High", "Rush"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded px-3 py-1.5 text-xs font-semibold cursor-pointer border transition ${
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
              <label className="text-xs font-medium">Requested Tests</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {["FA-AAS Au", "Multi-element 4-acid", "Multi-element Aqua Regia", "ICP-MS 51E", "LECO S/C"].map(
                  (t, i) => (
                    <label
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs cursor-pointer hover:bg-muted select-none"
                    >
                      <input type="checkbox" defaultChecked={i < 2} className="rounded text-primary border-input" />
                      {t}
                    </label>
                  )
                )}
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <TextAreaField
                label="Special Instructions"
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer select-none font-medium text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={generateBarcode}
                onChange={(e) => setGenerateBarcode(e.target.checked)}
                className="rounded border-input text-primary"
              />
              Generate QR & print label
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toast.success("Draft saved (mock)")}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted font-semibold cursor-pointer transition"
              >
                Save draft
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm transition"
              >
                <Check className="size-3.5" /> Register sample
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold inline-flex items-center gap-2">
              <ScanBarcode className="size-4 text-primary" /> Quick scan
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Scan an inbound shipment QR code to auto-fill the form.</p>
            <div
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  client: "Pacific Resources",
                  project: "Stockpile Audit",
                  weight: "2.10",
                }));
                toast.success("Inbound QR scanned and auto-filled!");
              }}
              className="mt-3 grid place-items-center rounded-lg border border-dashed border-border bg-muted/30 py-8 text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
            >
              Awaiting scanner input… (Click to simulate scan)
            </div>
          </div>
          
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold inline-flex items-center gap-2">
              <Upload className="size-4 text-primary" /> Bulk import
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">CSV with up to 500 samples per batch.</p>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleBulkCSV}
              onClick={() => toast.success("Browsing files... (Click simulate drop)")}
              className="mt-3 rounded-lg border-2 border-dashed border-border p-4 text-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
            >
              Drop CSV here or <span className="text-primary underline font-medium">browse</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
