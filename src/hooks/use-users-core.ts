import { useState, useCallback } from "react";
import { User } from "../types";
import { supabase } from "../lib/supabase";
import { mapDbRoleToUi, mapUiRoleToDb } from "../lib/auth-utils";

export function useUsersCore(
  currentName: string,
  addActivity: (who: string, what: string, target: string) => void,
) {
  const [users, setUsers] = useState<User[]>([]);

  const [tickets, setTickets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("gcs_tickets");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("gcs_settings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      orgName: "GeoChem Labs Inc.",
      orgUrl: "geochemlabs.suite.io",
      timezone: "UTC+01 · Lagos",
      currency: "USD",
      labProtocol: "ISO 17025 Accreditation",
      calInterval: "14 days",
      auditRetention: "7 years",
      matrixType: "Sulphide",
      primaryColor: "#00AEEF",
      logo: "",
      reportFooter: "© GeoChem Labs Inc. · ISO 17025 Accredited · contact@geochem.io",
      triggers: [
        "Report awaiting approval",
        "QA anomaly raised",
        "Sample overdue",
        "Instrument calibration due",
        "New customer signup",
      ],
      channels: ["In-app", "Email"],
      require2fa: true,
      sessionExpire: true,
      passRotation: "90 days",
      maxFailures: "5 attempts",
      apiKey: "sk_live_51Ny931Jkdsj92842Jksdlf...",
      webhookUrl: "https://api.geochemlabs.io/v1/webhooks",
      webhookHash: "whsec_kdjf892429...",
    };
  });

  // ─── saveUsers ─────────────────────────────────────────────────────────────
  // Internal helper — sets state. Does NOT write to localStorage (users are DB-sourced).
  const saveUsers = (data: User[]) => {
    setUsers(data);
  };

  // ─── mapDbRowToUser ────────────────────────────────────────────────────────
  // Maps a raw DB row from get_users_with_email RPC to the UI User type.
  function mapDbRowToUser(row: any): User {
    return {
      id: row.id,           // UUID — kept as-is (UI type uses number but UUID is fine for key)
      name: row.full_name || row.email?.split("@")[0] || "Unknown",
      email: row.email || "",
      role: mapDbRoleToUi(row.role),
      status: row.email_confirmed ? "Active" : "Invited",
      lastSeen: row.updated_at
        ? new Date(row.updated_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
    };
  }

  // ─── fetchUsers ────────────────────────────────────────────────────────────
  // Uses the get_users_with_email RPC (admin-only, SECURITY DEFINER) so we get
  // email addresses alongside public.users data without storing PII twice.
  // Falls back to plain public.users query if the caller isn't an admin.
  const fetchUsers = useCallback(async () => {
    // Try the admin RPC first (returns email + confirmed status)
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_users_with_email" as any,
    );

    if (!rpcError && Array.isArray(rpcData) && rpcData.length >= 0) {
      saveUsers(rpcData.map(mapDbRowToUser));
      return;
    }

    // Fallback: plain select on public.users (non-admin sessions, or RPC not yet deployed)
    if (rpcError) {
      console.warn("fetchUsers: get_users_with_email RPC failed, falling back to direct select:", rpcError.message);
    }

    const { data: usersData, error: usersErr } = await supabase
      .from("users" as any)
      .select("*, organizations(name)");

    if (!usersErr && usersData) {
      // In the fallback we don't have email from auth.users, so we use what's available
      saveUsers(
        (usersData as any[]).map((row) => ({
          id: row.id,
          name: row.full_name || "Unknown",
          email: "",  // Not available without admin RPC
          role: mapDbRoleToUi(row.role),
          status: "Active" as User["status"],
          lastSeen: row.updated_at
            ? new Date(row.updated_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
          organization: row.organizations?.name,
        })),
      );
    } else {
      saveUsers([]);
    }
  }, []);

  // ─── updateUserRole ────────────────────────────────────────────────────────
  // Calls admin_update_user_role RPC. The DB trigger trg_sync_user_role_to_auth
  // (migration 0011) automatically syncs the new role to auth.users metadata.
  const updateUserRole = async (userId: string, newRole: User["role"]) => {
    const dbRole = mapUiRoleToDb(newRole);

    const { error } = await supabase.rpc("admin_update_user_role" as any, {
      p_target_user_id: userId,
      p_new_role: dbRole,
    });

    if (error) throw error;

    // Optimistic UI update — reflects change immediately without re-fetching
    setUsers((prev) =>
      prev.map((u) => ((u.id as unknown as string) === userId ? { ...u, role: newRole } : u)),
    );

    addActivity(currentName, "changed role", `${userId} → ${newRole}`);
  };

  // ─── inviteUser ────────────────────────────────────────────────────────────
  // Delegates to useAuth().inviteUser via the prop-drilling pattern already
  // established in use-lims-state.tsx. The actual invite logic lives in use-auth.tsx.
  // This wrapper exists to keep the API surface of useUsersCore unchanged for
  // components that already import inviteUser from useLimsState.
  //
  // Implementation note: the real invite action is in AuthContext.inviteUser.
  // This hook receives an `inviteUserFn` injected from use-lims-state so we
  // don't create a circular dependency.
  const [_inviteUserFn, _setInviteUserFn] = useState<
    ((name: string, email: string, role: User["role"]) => Promise<void>) | null
  >(null);

  const setInviteUserFn = (fn: (name: string, email: string, role: User["role"]) => Promise<void>) => {
    _setInviteUserFn(() => fn);
  };

  const inviteUser = async (name: string, email: string, role: User["role"]) => {
    if (_inviteUserFn) {
      await _inviteUserFn(name, email, role);
    } else {
      // Fallback if auth context not yet wired: log clearly
      console.error("inviteUser: auth invite function not wired — call setInviteUserFn first");
      throw new Error("Invite service not ready. Please try again.");
    }
    addActivity(currentName, "invited user", `${email} (${role})`);
    // Refresh user list after invite so new user appears immediately
    await fetchUsers();
  };

  // ─── Support Tickets ───────────────────────────────────────────────────────
  const addSupportTicket = (ticket: any) => {
    setTickets((prev) => {
      const updated = [ticket, ...prev];
      localStorage.setItem("gcs_tickets", JSON.stringify(updated));
      return updated;
    });
  };

  // ─── Settings ──────────────────────────────────────────────────────────────
  const updateSettings = (newSettings: any) => {
    setSettings((prev: any) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("gcs_settings", JSON.stringify(updated));
      return updated;
    });
  };

  return {
    users,
    setUsers,
    saveUsers,
    tickets,
    setTickets,
    settings,
    setSettings,
    inviteUser,
    setInviteUserFn,
    updateUserRole,
    addSupportTicket,
    updateSettings,
    fetchUsers,
  };
}
