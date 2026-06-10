import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import React, { useState } from "react";
import { useAuth, formatAuthError } from "../hooks/use-auth";
import { InputField } from "../components/shared/form-controls";
import { toast } from "sonner";
import { BRAND_ASSETS } from "@/lib/branding";
import { UniPodLogo } from "@/components/branding/UniPodLogo";
import { z } from "zod";
import { supabase } from "../lib/supabase";

const resetPasswordSearchSchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  error_code: z.string().optional(),
  error_description: z.string().optional(),
  type: z.string().optional(),
  token_hash: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  component: ResetPassword,
});

function ResetPassword() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const authContext = useAuth();
  const { resetPassword, loading: authLoading, session: authSession, currentUser } = authContext;
  
  const isExpired = search.error === "access_denied" || search.error_code === "otp_expired";
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [exchanging, setExchanging] = useState(!!search.code);

  // DEBUG STATE
  const [debugUrl, setDebugUrl] = useState("");
  const [debugSearch, setDebugSearch] = useState("");
  const [debugHash, setDebugHash] = useState("");
  const [debugExchangeResult, setDebugExchangeResult] = useState("");
  const [debugUpdateResult, setDebugUpdateResult] = useState("");
  const [authEvents, setAuthEvents] = useState<string[]>([]);

  React.useEffect(() => {
    setDebugUrl(window.location.href);
    setDebugSearch(window.location.search);
    setDebugHash(window.location.hash);

    const interval = setInterval(() => {
      setDebugUrl(window.location.href);
      setDebugSearch(window.location.search);
      setDebugHash(window.location.hash);
    }, 500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      setAuthEvents(prev => [...prev, `${new Date().toLocaleTimeString()} - ${event}`]);
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    async function exchange() {
      if (!search.code) {
        setDebugExchangeResult("Skipped: no search.code found");
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setDebugExchangeResult("Skipped: existing session found");
          if (active) setExchanging(false);
          return;
        }

        setDebugExchangeResult("Calling exchangeCodeForSession...");
        const { error, data } = await supabase.auth.exchangeCodeForSession(search.code);
        if (error) {
          setDebugExchangeResult(`Failed: ${error.message}`);
          throw error;
        }
        setDebugExchangeResult(`Success: session ${data.session?.user.id}`);
        const { clearAuthCallbackFromUrl } = await import("@/lib/auth-email-verification");
        clearAuthCallbackFromUrl();
      } catch (err: any) {
        setDebugExchangeResult(`Error caught: ${err?.message || err}`);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && active) {
          setError("Failed to establish secure session. Please try clicking the reset link again.");
        }
      } finally {
        if (active) setExchanging(false);
      }
    }
    exchange();
    return () => {
      active = false;
    };
  }, [search.code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDebugUpdateResult("Submitting...");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setDebugUpdateResult("Validation failed: too short");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setDebugUpdateResult("Validation failed: mismatch");
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.auth.updateUser({ password });
      if (response.error) {
        setDebugUpdateResult(`Error: ${response.error.message}`);
        throw response.error;
      }
      setDebugUpdateResult("Success!");
      setSuccess(true);
      toast.success("Password set successfully.");
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 3000);
    } catch (err) {
      setDebugUpdateResult(`Exception: ${err instanceof Error ? err.message : String(err)}`);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden bg-slate-900 p-8 overflow-y-auto font-mono text-xs text-green-400">
        <h2 className="text-xl text-white mb-4 border-b border-green-800 pb-2">PASSWORD RESET DEBUG PANEL</h2>
        
        <div className="space-y-4">
          <section>
            <h3 className="text-white font-bold">1. Routing State (Polled 500ms)</h3>
            <div><strong>URL:</strong> {debugUrl}</div>
            <div><strong>Search:</strong> {debugSearch || "empty"}</div>
            <div><strong>Hash:</strong> {debugHash || "empty"}</div>
            <div><strong>Parsed Code:</strong> {search.code || "undefined"}</div>
          </section>

          <section>
            <h3 className="text-white font-bold">2. Context State</h3>
            <div><strong>Auth Loading:</strong> {authLoading ? "true" : "false"}</div>
            <div><strong>Has Session:</strong> {authSession ? `true (${authSession.user.id})` : "false"}</div>
            <div><strong>Current User:</strong> {currentUser ? JSON.stringify(currentUser) : "null"}</div>
          </section>

          <section>
            <h3 className="text-white font-bold">3. Local State</h3>
            <div><strong>Exchanging:</strong> {exchanging ? "true" : "false"}</div>
            <div><strong>Submit Loading:</strong> {loading ? "true" : "false"}</div>
            <div><strong>Error:</strong> {error || "none"}</div>
          </section>

          <section>
            <h3 className="text-white font-bold">4. Execution Results</h3>
            <div><strong>Exchange Result:</strong> {debugExchangeResult || "Pending..."}</div>
            <div><strong>Update Result:</strong> {debugUpdateResult || "Pending..."}</div>
          </section>

          <section>
            <h3 className="text-white font-bold">5. Auth Listener Events</h3>
            {authEvents.length === 0 ? "No events yet" : authEvents.map((e, i) => <div key={i}>{e}</div>)}
          </section>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background relative border-l border-border">
        {isExpired ? (
          <div className="w-full max-w-sm bg-card p-6 sm:p-8 rounded-xl border border-border shadow-lg flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Link Expired</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This link has expired or is no longer valid. Please contact your administrator to send a new invitation.
            </p>
            <Link
              to="/login"
              className="w-full inline-flex justify-center rounded-md gradient-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-sm bg-card p-6 sm:p-8 rounded-xl border border-border shadow-lg">
            <UniPodLogo height={32} linkToHome />
            
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground font-display">
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your new password below.
            </p>

            {exchanging ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Establishing secure auth session...
                </p>
              </div>
            ) : success ? (
              <div className="mt-6">
                <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm border border-green-200 text-center mb-6">
                  Password set successfully. You can now sign in.
                </div>
                <Link
                  to="/login"
                  className="w-full inline-flex justify-center rounded-md gradient-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
                >
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <InputField
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="size-4 text-muted-foreground" />}
                  disabled={loading}
                  required
                  minLength={8}
                />

                <InputField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock className="size-4 text-muted-foreground" />}
                  disabled={loading}
                  required
                  minLength={8}
                />

                {error && (
                  <p className="text-sm text-destructive font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-md gradient-primary px-3 py-2.5 text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Setting Password…
                    </>
                  ) : (
                    <>
                      Set Password <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

