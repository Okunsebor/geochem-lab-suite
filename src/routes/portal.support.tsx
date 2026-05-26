import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/support")({ component: Support });
function Support() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">Get help from the GeoChem team — typically replies within 2 business hours.</p>
        <div className="mt-6 space-y-2">
          {[["My report shows unexpected values","Open"],["Shipping label not received","Resolved"],["Add a second project user","Resolved"]].map((t,i)=>(
            <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
              <span>{t[0]}</span><span className={`text-xs ${t[1]==="Open"?"text-warning":"text-success"}`}>{t[1]}</span>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={e=>{e.preventDefault();toast.success("Request sent");}} className="rounded-xl border border-border bg-card p-6 space-y-3 h-fit">
        <h2 className="font-semibold">New request</h2>
        <input placeholder="Subject" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/>
        <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option>Category: Sample question</option><option>Category: Report issue</option><option>Category: Billing</option></select>
        <textarea placeholder="Describe your issue…" className="w-full rounded-md border border-input bg-background p-2 text-sm min-h-[120px]"/>
        <button className="w-full rounded-md gradient-primary px-3 py-2 text-sm text-white">Send</button>
      </form>
    </div>
  );
}
