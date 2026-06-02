import React, { useState } from "react";
import { Plus, Shield } from "lucide-react";
import { useLimsState } from "../../../hooks/use-lims-state";
import { PageHeader } from "../../../components/layout/PageHeader";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { InputField, SelectField } from "../../../components/shared/form-controls";
import { toast } from "sonner";

export function UsersRolesPanel() {
  const { users, inviteUser } = useLimsState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<any>("Lab Coordinator");
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    inviteUser(name, email, role);
    setName("");
    setEmail("");
    setShowInviteModal(false);
    toast.success(`Invitation successfully dispatched to ${email}!`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Administration" }, { label: "Users & Roles" }]}
        title="Users & Roles"
        description="Manage workspace members, roles, and permissions."
        actions={
          <button
            onClick={() => setShowInviteModal(!showInviteModal)}
            className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm transition"
          >
            <Plus className="size-3.5" /> Invite user
          </button>
        }
      />

      {showInviteModal && (
        <form
          onSubmit={handleInviteSubmit}
          className="rounded-xl border border-border bg-card p-5 space-y-4 max-w-md animate-in fade-in zoom-in-95 duration-150"
        >
          <h3 className="text-sm font-semibold text-foreground">Invite New Workspace User</h3>
          <div className="space-y-3">
            <InputField
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adaeze Nwosu"
              required
            />
            <InputField
              label="Work email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@geochem.io"
              required
            />
            <SelectField
              label="Session role assignment"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { label: "Admin", value: "Admin" },
                { label: "Lab Coordinator", value: "Lab Coordinator" },
                { label: "Customer", value: "Customer" },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-3 mt-1">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="rounded border border-border bg-background px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded gradient-primary px-3 py-1.5 text-xs text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm"
            >
              Dispatch Invite
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          ["Admin", "Full platform access", users.filter((u) => u.role === "Admin").length],
          ["Lab Coordinator", "Workflow + reporting", users.filter((u) => u.role === "Lab Coordinator").length],
          ["Customer", "Portal access", users.filter((u) => u.role === "Customer").length],
        ].map((r) => (
          <div key={r[0]} className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold inline-flex items-center gap-2 text-foreground">
                <Shield className="size-4 text-primary" /> {r[0]}
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">{r[2]} users</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground font-medium">{r[1]}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-left [&>th]:font-semibold border-b border-border">
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last seen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 [&>td]:px-4 [&>td]:py-2.5 font-medium transition-colors hover:bg-muted/10">
                  <td className="flex items-center gap-2">
                    <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      {u.name
                        .split(" ")
                        .map((x) => x[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    {u.name}
                  </td>
                  <td className="text-muted-foreground">{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="text-muted-foreground text-xs">{u.lastSeen}</td>
                  <td>
                    <button
                      onClick={() => toast.success(`Editing profile settings for ${u.name}`)}
                      className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
