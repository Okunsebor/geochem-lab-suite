import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { ScanBarcode, Upload, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/intake")({ component: Intake });

function Intake() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Sample Intake" }]}
        title="Sample Intake"
        description="Register new samples — single entry or bulk import."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Sample registered (mock)"); }}
              className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { l: "Client", v: "Auric Mining Ltd" },
              { l: "Project", v: "Drillhole AX-204" },
              { l: "Sample Type", v: "Drill Core" },
              { l: "Matrix", v: "Sulphide" },
              { l: "Sample Weight (kg)", v: "1.42" },
              { l: "Container", v: "Calico Bag" },
              { l: "Received From", v: "Field Tech A. Vargas" },
              { l: "Date Received", v: "2026-05-26" },
            ].map((f) => (
              <div key={f.l}>
                <label className="text-xs font-medium">{f.l}</label>
                <input defaultValue={f.v} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium">Requested Tests</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {["FA-AAS Au","Multi-element 4-acid","Multi-element Aqua Regia","ICP-MS 51E","LECO S/C"].map((t,i) => (
                  <label key={t} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs">
                    <input type="checkbox" defaultChecked={i < 2} /> {t}
                  </label>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium">Special Instructions</label>
              <textarea defaultValue="Handle as rush — confidential project." className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm min-h-[80px]" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <label className="inline-flex items-center gap-1.5 text-xs"><input type="checkbox" defaultChecked /> Generate QR & print label</label>
            <div className="flex gap-2">
              <button type="button" className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted">Save draft</button>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white"><Check className="size-3.5" /> Register sample</button>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold inline-flex items-center gap-2"><ScanBarcode className="size-4 text-primary" /> Quick scan</h3>
            <p className="mt-1 text-xs text-muted-foreground">Scan an inbound shipment QR code to auto-fill the form.</p>
            <div className="mt-3 grid place-items-center rounded-lg border border-dashed border-border bg-muted/30 py-8 text-xs text-muted-foreground">
              Awaiting scanner input…
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold inline-flex items-center gap-2"><Upload className="size-4 text-primary" /> Bulk import</h3>
            <p className="mt-1 text-xs text-muted-foreground">CSV with up to 500 samples per batch.</p>
            <div className="mt-3 rounded-lg border-2 border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Drop CSV here or <span className="text-primary underline cursor-pointer">browse</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
