import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth, formatAuthError, getPortalPathForRole } from "../../../hooks/use-auth";
import { InputField } from "../../../components/shared/form-controls";
import { toast } from "sonner";
import { getVerifyEmailPath } from "@/lib/auth-routes";
import type { User } from "@/types";
import { UniPodLogo } from "@/components/branding/UniPodLogo";
import { DEMO_MODE_ENABLED } from "@/lib/auth-utils";

export function LoginForm({ portalIntent = false }: { portalIntent?: boolean }) {
  const { login, switchUserRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectForRole = (role: User["role"]) => {
    window.location.href = getPortalPathForRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      const { role } = await login(email, password);
      toast.success("Signed in securely.");
      redirectForRole(role);
    } catch (err: unknown) {
      const message = formatAuthError(err);
      if (message.includes("verify your email")) {
        toast.error(message);
        window.location.href = getVerifyEmailPath(email);
        return;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleEnter = async (role: User["role"]) => {
    if (!DEMO_MODE_ENABLED) return;
    const roleEmails: Record<User["role"], string> = {
      Admin: "adaeze@geochem.io",
      "Lab Coordinator": "m.rivera@geochem.io",
      "Lab Staff": "keiko@geochem.io",
      Customer: "jane@auricmining.com",
    };

    setLoading(true);
    try {
      const { role: resolvedRole } = await login(roleEmails[role], "password123");
      toast.success(`Signed in as ${resolvedRole}`);
      redirectForRole(resolvedRole);
    } catch {
      switchUserRole(role);
      toast.info(`Development sandbox: ${role}`);
      redirectForRole(role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-card p-6 sm:p-8 rounded-xl border border-border shadow-lg">
      <UniPodLogo height={32} linkToHome />

      <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground font-display">
        {portalIntent ? "Customer portal" : "Sign in"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {portalIntent
          ? "Access your verified customer workspace."
          : "Admin, lab coordinator, or registered customer accounts."}
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="size-4 text-muted-foreground" />}
          disabled={loading}
          required
          autoComplete="email"
        />

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-foreground">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline font-semibold">
              Forgot?
            </Link>
          </div>
          <InputField
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="size-4 text-muted-foreground" />}
            disabled={loading}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-md gradient-primary px-3 py-2.5 text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Authenticating…
            </>
          ) : (
            <>
              Sign in <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {DEMO_MODE_ENABLED && (
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-[10px] text-muted-foreground mb-2 text-center uppercase tracking-wider font-bold">
            Development demo portals
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { role: "Admin" as const, label: "Admin" },
                { role: "Lab Coordinator" as const, label: "Coordinator" },
                { role: "Lab Staff" as const, label: "Staff" },
                { role: "Customer" as const, label: "Customer" },
              ] as const
            ).map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => handleRoleEnter(r.role)}
                disabled={loading}
                className="rounded-md border border-border bg-card px-2 py-2 text-xs text-center cursor-pointer hover:border-accent/50 hover:bg-accent/10 font-semibold transition disabled:opacity-50"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        New client?{" "}
        <Link to="/register" className="text-primary hover:underline font-semibold">
          Register first
        </Link>
      </p>
    </div>
  );
}
