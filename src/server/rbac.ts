import { createClient } from "@supabase/supabase-js";

type UiRole = "Admin" | "Lab Coordinator" | "Customer";

function getEnv(name: string): string {
  const v = process.env[name] ?? process.env[`VITE_${name}`];
  if (!v) throw new Error(`Missing required server env var: ${name}`);
  return v;
}

// Server-side Supabase client for token validation and role lookup.
// Uses ANON key (safe on server); authorization is driven by RLS + DB role checks.
const supabaseUrl = getEnv("SUPABASE_URL");
const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");
const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

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
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  if (!token) throw new ApiAuthError("Missing bearer token");

  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) throw new ApiAuthError("Invalid or expired token");

  const { data: profile, error: profileErr } = await supabaseServer
    .from("users" as any)
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileErr) throw new ApiAuthError("Unable to resolve user role");

  const role = mapDbRoleToUi(profile?.role ?? "customer");
  return { userId: data.user.id, email: data.user.email ?? null, role };
}

export async function requireApiRole(request: Request, allowed: UiRole[]): Promise<void> {
  const { role } = await requireApiUser(request);
  if (!allowed.includes(role)) throw new ApiForbiddenError("Insufficient role");
}
