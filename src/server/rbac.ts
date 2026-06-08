

type UiRole = "Admin" | "Lab Coordinator" | "Customer";

function getEnv(name: string): string {
  const v = process.env[name] ?? process.env[`VITE_${name}`];
  if (!v) throw new Error(`Missing required server env var: ${name}`);
  return v;
}

import { getServerSupabase } from "@/lib/supabase-server";

export class ApiAuthError extends Error {
  status = 401 as const;
}

export class ApiForbiddenError extends Error {
  status = 403 as const;
}

function mapDbRoleToUi(dbRole: string): UiRole {
  switch (String(dbRole).toLowerCase()) {
    case "admin":
      return "Admin";
    case "manager":
    case "technician":
      return "Lab Coordinator";
    default:
      return "Customer";
  }
}

export async function requireApiUser(request: Request): Promise<{
  userId: string;
  email: string | null;
  role: UiRole;
}> {
  const supabaseServer = getServerSupabase();
  
  const { data: { user }, error } = await supabaseServer.auth.getUser();
  if (error || !user) throw new ApiAuthError("Invalid or expired session");

  const { data: profile, error: profileErr } = await supabaseServer
    .from("users" as any)
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileErr) throw new ApiAuthError("Unable to resolve user role");

  const role = mapDbRoleToUi(profile?.role ?? "customer");
  return { userId: user.id, email: user.email ?? null, role };
}

export async function requireApiRole(request: Request, allowed: UiRole[]): Promise<void> {
  const { role } = await requireApiUser(request);
  if (!allowed.includes(role)) throw new ApiForbiddenError("Insufficient role");
}
