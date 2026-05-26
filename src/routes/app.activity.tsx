import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { activity } from "@/lib/mock-data";

export const Route = createFileRoute("/app/activity")({ component: ActivityLog });

function ActivityLog() {
  const all = [...activity, ...activity, ...activity];
  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{label:"Operations"},{label:"Activity Logs"}]} title="Activity Logs" description="Full audit trail of every action across the platform." />
      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
              <th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>IP</th>
            </tr>
          </thead>
          <tbody>
            {all.map((a,i)=>(
              <tr key={i} className="border-t border-border [&>td]:px-4 [&>td]:py-2.5">
                <td className="text-muted-foreground text-xs">{a.when}</td>
                <td className="font-medium">{a.who}</td>
                <td className="text-muted-foreground">{a.what}</td>
                <td className="font-mono text-xs text-primary">{a.target}</td>
                <td className="text-muted-foreground text-xs">10.0.1.{20+i}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
