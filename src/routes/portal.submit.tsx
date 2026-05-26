import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/submit")({ component: Submit });

function Submit() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Submit a Sample</h1>
      <p className="text-sm text-muted-foreground mt-1">Provide the details and we'll generate a shipping label and chain-of-custody form.</p>
      <form onSubmit={(e)=>{e.preventDefault();toast.success("Submission received — shipping label emailed (mock)");}} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6">
        {[["Project name","Drillhole AX-204"],["Number of samples","24"],["Sample type","Drill Core"],["Requested tests","FA-AAS Au, Multi-element 51E"],["Priority","High"],["Field contact","A. Vargas"]].map((f)=>(
          <div key={f[0]}><label className="text-xs font-medium">{f[0]}</label><input defaultValue={f[1]} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/></div>
        ))}
        <div><label className="text-xs font-medium">Special instructions</label><textarea className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm min-h-[80px]"/></div>
        <button className="w-full rounded-md gradient-primary px-3 py-2 text-sm text-white">Generate shipping label</button>
      </form>
    </div>
  );
}
