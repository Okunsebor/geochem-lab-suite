import React, { useState } from "react";
import { Plus, Shield, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useLimsState } from "../../../hooks/use-lims-state";
import { PageHeader } from "../../../components/layout/PageHeader";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { InputField, SelectField } from "../../../components/shared/form-controls";
import { toast } from "sonner";
import type { User } from "../../../types";

const ROLES: Array<{ label: string; value: User["role"] }> = [
  { label: "Admin", value: "Admin" },
  { label: "Lab Coordinator", value: "Lab Coordinator" },
  { label: "Customer", value: "Customer" },
];

const ROLE_COLOURS: Record<User["role"], string> = {
  Admin: "text-rose-500 bg-rose-500/10",
  "Lab Coordinator": "text-amber-500 bg-amber-500/10",
  Customer: "text-sky-500 bg-sky-500/10",
};

export function UsersRolesPanel() {
  const { users, inviteUser, updateUserRole } = useLimsState();

  // Invite form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<User["role"]>("Lab Coordinator");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Per-row role-change tracking: userId → pending role string
  const [pendingRoles, setPendingRoles] = useState<Record<string, User["role"]>>({});
  // Per-row save loading
  const [savingRole, setSavingRole] = useState<Record<string, boolean>>({});

  // ─── Invite ───────────────────────────────────────────────────────────────
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setInviteLoading(true);
    try {
      await inviteUser(name.trim(), email.trim(), role);
      toast.success(`Invite sent to ${email}. They will receive a sign-in link.`);
      setName("");
      setEmail("");
      setRole("Lab Coordinator");
      setShowInviteModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invite failed";
      toast.error(msg);
    } finally {
      setInviteLoading(false);
    }
  };

  // ─── Role change ──────────────────────────────────────────────────────────
  const handleRoleChange = (userId: string, newRole: User["role"]) => {
    setPendingRoles((prev) => ({ ...prev, [userId]: newRole }));
  };

  const handleRoleSave = async (userId: string) => {
    const newRole = pendingRoles[userId];
    if (!newRole) return;

    setSavingRole((prev) => ({ ...prev, [userId]: true }));
    try {
      await updateUserRole(userId, newRole);
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      toast.success(`Role updated to ${newRole}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Role update failed";
      toast.error(msg);
    } finally {
      setSavingRole((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
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

      {/* ── Invite Modal ── */}
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
              disabled={inviteLoading}
              required
            />
            <InputField
              label="Work email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@geochem.io"
              disabled={inviteLoading}
              required
            />
            <SelectField
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as User["role"])}
              options={ROLES}
              disabled={inviteLoading}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The invited user will receive a sign-in link by email. Their account will be created
            with the selected role.
          </p>
          <div className="flex justify-end gap-2 border-t border-border pt-3 mt-1">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              disabled={inviteLoading}
              className="rounded border border-border bg-background px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteLoading}
              className="inline-flex items-center gap-1.5 rounded gradient-primary px-3 py-1.5 text-xs text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm disabled:opacity-50"
            >
              {inviteLoading ? (
                <>
                  <Loader2 className="size-3 animate-spin" /> Sending…
                </>
              ) : (
                "Send Invite"
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── Role Summary Cards ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {ROLES.map((r) => (
          <div
            key={r.value}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold inline-flex items-center gap-2 text-foreground">
                <Shield className="size-4 text-primary" /> {r.label}
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">
                {users.filter((u) => u.role === r.value).length} users
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              {r.value === "Admin"
                ? "Full platform access"
                : r.value === "Lab Coordinator"
                  ? "Workflow + reporting"
                  : "Customer portal access"}
            </p>
          </div>
        ))}
      </div>

      {/* ── Users Table ── */}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No users found. Invite a team member to get started.
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const userId = String(u.id);
                const hasPending = pendingRoles[userId] !== undefined;
                const isSaving = savingRole[userId] === true;

                return (
                  <tr
                    key={userId}
                    className="border-b border-border last:border-0 [&>td]:px-4 [&>td]:py-3 font-medium transition-colors hover:bg-muted/10"
                  >
                    {/* Avatar + name */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          {(u.name || "?")
                            .split(" ")
                            .map((x) => x[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="truncate max-w-[120px]">{u.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="text-muted-foreground text-xs truncate max-w-[160px]">
                      {u.email || <span className="italic opacity-50">—</span>}
                    </td>

                    {/* Role — inline dropdown */}
                    <td>
                      <select
                        value={pendingRoles[userId] ?? u.role}
                        onChange={(e) => handleRoleChange(userId, e.target.value as User["role"])}
                        disabled={isSaving}
                        className={`rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold cursor-pointer transition
                          focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50
                          ${ROLE_COLOURS[pendingRoles[userId] ?? u.role]}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={u.status} />
                    </td>

                    {/* Last seen */}
                    <td className="text-muted-foreground text-xs">{u.lastSeen}</td>

                    {/* Save / Cancel role change */}
                    <td>
                      {hasPending ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRoleSave(userId)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 rounded bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 text-[11px] font-semibold transition disabled:opacity-50"
                          >
                            {isSaving ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <CheckCircle className="size-3" />
                            )}
                            {isSaving ? "Saving…" : "Save"}
                          </button>
                          <button
                            onClick={() =>
                              setPendingRoles((prev) => {
                                const next = { ...prev };
                                delete next[userId];
                                return next;
                              })
                            }
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 rounded border border-border hover:bg-muted px-2 py-1 text-[11px] font-semibold transition disabled:opacity-50"
                          >
                            <AlertCircle className="size-3 text-muted-foreground" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No changes</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
