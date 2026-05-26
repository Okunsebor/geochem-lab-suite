import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../../../hooks/use-auth";
import { InputField } from "../../../components/shared/form-controls";
import { toast } from "sonner";

export function LoginForm() {
  const { login, switchUserRole } = useAuth();
  const [email, setEmail] = useState("adaeze@geochem.io");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Signed in securely!");
      window.location.href = "/app";
    } catch (err: any) {
      console.warn("Real Auth login failed:", err.message);
      // Fallback sandbox login
      if (email === "adaeze@geochem.io") {
        switchUserRole("Admin");
        toast.info("Entered LIMS Workspace as Admin (Sandbox simulation)");
        window.location.href = "/app";
      } else {
        toast.error(err.message || "Failed to authenticate. Verify credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleEnter = async (role: "Admin" | "Lab Coordinator" | "Lab Staff" | "Customer") => {
    let roleEmail = "adaeze@geochem.io";
    if (role === "Lab Coordinator") roleEmail = "m.rivera@geochem.io";
    if (role === "Lab Staff") roleEmail = "keiko@geochem.io";
    if (role === "Customer") roleEmail = "jane@auricmining.com";

    setLoading(true);
    try {
      await login(roleEmail, "password123");
      toast.success(`Authenticated securely as ${role}!`);
      window.location.href = role === "Customer" ? "/portal" : "/app";
    } catch (err: any) {
      // Fallback sandbox simulation for offline/non-migrated database setup
      console.warn("Real Auth failed, falling back to LIMS Sandbox simulation:", err.message);
      switchUserRole(role);
      toast.info(`Entered LIMS Workspace as ${role} (Sandbox simulation)`);
      window.location.href = role === "Customer" ? "/portal" : "/app";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-card p-6 sm:p-8 rounded-xl border border-border">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground font-medium">Sign in to continue to GeoChem Suite.</p>
      
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="size-4 text-muted-foreground" />}
          disabled={loading}
          required
        />
        
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-foreground">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline font-semibold">Forgot?</Link>
          </div>
          <InputField
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="size-4 text-muted-foreground" />}
            disabled={loading}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-xs select-none cursor-pointer text-muted-foreground hover:text-foreground font-medium">
          <input type="checkbox" defaultChecked className="rounded border-input text-primary" disabled={loading} />
          Keep me signed in
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-md gradient-primary px-3 py-2 text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Authenticating...
            </>
          ) : (
            <>
              Sign in <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-border pt-4">
        <p className="text-[10px] text-muted-foreground mb-2 text-center uppercase tracking-wider font-bold">Fast-track Demo Roles</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { role: "Admin" as const, label: "Admin" },
            { role: "Lab Staff" as const, label: "Staff" },
            { role: "Customer" as const, label: "Client" },
          ].map((r) => (
            <button
              key={r.role}
              onClick={() => handleRoleEnter(r.role)}
              disabled={loading}
              className="rounded-md border border-border bg-card px-2 py-2 text-xs text-center cursor-pointer hover:border-primary/40 hover:bg-muted/40 font-semibold transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground font-medium">
        No account? <Link to="/register" className="text-primary hover:underline font-semibold">Request access</Link>
      </p>
    </div>
  );
}
