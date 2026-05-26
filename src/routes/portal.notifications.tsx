import { createFileRoute } from "@tanstack/react-router";
import { notifications } from "@/lib/mock-data";

export const Route = createFileRoute("/portal/notifications")({ component: PN });
function PN() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <ul className="rounded-xl border border-border bg-card divide-y divide-border">
        {notifications.map(n=>(
          <li key={n.id} className="p-4 text-sm"><p>{n.title}</p><p className="text-xs text-muted-foreground mt-0.5">{n.time} ago</p></li>
        ))}
      </ul>
    </div>
  );
}
