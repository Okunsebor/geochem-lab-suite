import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { notifications } from "@/lib/mock-data";
import { Bell, Mail, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({ component: Notifications });

function Notifications() {
  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{label:"Administration"},{label:"Notifications"}]} title="Notification Center" description="System alerts, approvals, and reminders." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">All notifications</h3>
            <button className="text-xs text-primary hover:underline">Mark all as read</button>
          </div>
          <ul>
            {[...notifications,...notifications].map((n,i)=>(
              <li key={i} className="border-t border-border first:border-0 p-4 flex gap-3 hover:bg-muted/30">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.kind==="alert"?"bg-destructive":n.kind==="approval"?"bg-warning":"bg-info"}`}/>
                <div className="flex-1">
                  <p className="text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.time} ago · {n.kind}</p>
                </div>
                <button className="text-xs text-primary">View</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Channels</h3>
            {([
              { Icon: Bell, label: "In-app", on: true },
              { Icon: Mail, label: "Email", on: true },
              { Icon: MessageSquare, label: "SMS (coming soon)", on: false },
            ]).map(({ Icon, label, on }, i) => (
              <label key={i} className="mt-3 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-muted-foreground"><Icon className="size-4"/> {label}</span>
                <input type="checkbox" defaultChecked={on} />
              </label>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Triggers</h3>
            <ul className="mt-3 space-y-2 text-xs">
              {["Report awaiting approval","QA anomaly raised","Sample overdue","Instrument calibration due","New customer signup"].map((t)=>(
                <li key={t} className="flex items-center justify-between rounded border border-border px-2 py-1.5"><span>{t}</span><input type="checkbox" defaultChecked/></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
