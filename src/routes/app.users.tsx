import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { StatusBadge } from "@/components/lims/status-badge";
import { users } from "@/lib/mock-data";
import { Plus, Shield } from "lucide-react";

export const Route = createFileRoute("/app/users")({ component: UsersPage });

function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{label:"Administration"},{label:"Users & Roles"}]} title="Users & Roles" description="Manage workspace members, roles, and permissions."
        actions={<button className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white"><Plus className="size-3.5"/> Invite user</button>} />

      <div className="grid gap-4 lg:grid-cols-3">
        {[["Admin","Full platform access",2],["Lab Coordinator","Workflow + reporting",1],["Lab Staff","Sample handling",2],["Customer","Portal access",2]].map((r)=>(
          <div key={r[0]} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold inline-flex items-center gap-2"><Shield className="size-4 text-primary"/> {r[0]}</h3>
              <span className="text-xs text-muted-foreground">{r[2]} users</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r[1]}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
              <th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Last seen</th><th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u)=>(
              <tr key={u.id} className="border-t border-border [&>td]:px-4 [&>td]:py-2.5">
                <td className="flex items-center gap-2"><div className="grid size-7 place-items-center rounded-full gradient-primary text-[10px] font-semibold text-white">{u.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</div>{u.name}</td>
                <td className="text-muted-foreground">{u.email}</td>
                <td>{u.role}</td>
                <td><StatusBadge status={u.status}/></td>
                <td className="text-muted-foreground text-xs">{u.lastSeen}</td>
                <td><button className="text-xs text-primary hover:underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
