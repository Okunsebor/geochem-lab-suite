import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth, formatAuthError } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { UniPodLogo } from "@/components/branding/UniPodLogo";
import { UNIPOD_BRAND } from "@/lib/branding";
import { getPortalPathForRole } from "@/lib/auth-routes";
import { mapDbRoleToUi } from "@/lib/auth-utils";
import {
  completeEmailVerificationFromUrl,
  isSupabaseConfigured,
  parseEmailVerificationCallback,
} from "@/lib/auth-email-verification";
import type { User } from "@/types";

type VerifyStatus = "pending" | "verifying" | "success" | "error";

export function VerifyEmailPage({ initialEmail }: { initialEmail?: string }) {
  const { resendVerificationEmail, getResendCooldown, refreshProfile, currentUser, emailVerified } =
    useAuth();
  const navigate = useNavigate();

  const [email] = useState(initialEmail ?? "");
  const [status, setStatus] = useState<VerifyStatus>("pending");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [handlingEmailLink, setHandlingEmailLink] = useState(false);
  const supabaseReady = isSupabaseConfigured();

  const handleVerifiedRedirect = useCallback(async () => {
    setStatus("success");
    await refreshProfile();

    let role: User["role"] = "Customer";
    const {
      data: { session: active },
    } = await supabase.auth.getSession();
    if (active?.user) {
      const { data: profile } = await supabase
        .from("users" as any)
        .select("role")
        .eq("id", active.user.id)
        .maybeSingle();
      if (profile?.role) role = mapDbRoleToUi(profile.role);
      else if (active.user.user_metadata?.role) {
        // user_metadata.role is the raw DB string ("admin", "manager", "customer").
        // Must go through mapDbRoleToUi before being passed to getPortalPathForRole.
        role = mapDbRoleToUi(active.user.user_metadata.role as string);
      }
    }

    window.setTimeout(() => {
      void navigate({ to: getPortalPathForRole(role) });
    }, 2500);
  }, [navigate, refreshProfile]);

  useEffect(() => {
    if (!email) return;
    setCooldown(getResendCooldown(email));
    const timer = setInterval(() => {
      setCooldown(getResendCooldown(email));
    }, 1000);
    return () => clearInterval(timer);
  }, [email, getResendCooldown]);

  useEffect(() => {
    if (emailVerified && currentUser) {
      handleVerifiedRedirect();
    }
  }, [emailVerified, currentUser, handleVerifiedRedirect]);

  // User clicked the verification link in email — complete from URL params (PKCE / token_hash)
  useEffect(() => {
    const callback = parseEmailVerificationCallback();
    if (callback.kind === "none") return;

    let cancelled = false;
    setHandlingEmailLink(true);
    setStatus("verifying");
    setMessage("Confirming your email…");

    completeEmailVerificationFromUrl()
      .then(async (ok) => {
        if (cancelled) return;
        if (ok) {
          await handleVerifiedRedirect();
        } else {
          setStatus("error");
          setMessage(
            "Could not confirm your email from this link. Please request a new verification email.",
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(formatAuthError(err));
      })
      .finally(() => {
        if (!cancelled) setHandlingEmailLink(false);
      });

    return () => {
      cancelled = true;
    };
  }, [handleVerifiedRedirect]);

  const handleResend = async () => {
    if (!email.trim()) {
      setMessage("No email address available. Please register again.");
      setStatus("error");
      return;
    }
    setResending(true);
    setMessage("");
    setStatus("pending");
    try {
      await resendVerificationEmail(email);
      setCooldown(getResendCooldown(email));
    } catch (err) {
      setStatus("error");
      setMessage(formatAuthError(err));
    } finally {
      setResending(false);
    }
  };

  const isSuccess = status === "success";
  const isFailure = status === "error";

  return (
    <div className="w-full max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
        className="rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 overflow-hidden"
      >
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${UNIPOD_BRAND.primary}, ${UNIPOD_BRAND.accent})`,
          }}
        />

        <div className="p-8 sm:p-10">
          <UniPodLogo height={32} linkToHome />

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                  className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-success/15"
                >
                  <CheckCircle2 className="size-10 text-success" />
                </motion.div>
                <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
                  Email verified!
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your account is now active. Redirecting to your dashboard…
                </p>
                <motion.div
                  className="mt-6 h-1 rounded-full bg-muted overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: UNIPOD_BRAND.primary }}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
                      Verify your email
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      UniPod GeoChem Suite — Secure onboarding
                    </p>
                  </div>
                </div>

                {/* Email display — visible but NOT editable */}
                {email && (
                  <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <Mail className="size-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Verification sent to
                      </p>
                      <p className="text-sm font-semibold text-foreground truncate">{email}</p>
                    </div>
                  </div>
                )}

                <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                  We sent a verification link to your email. Open your inbox and{" "}
                  <strong className="text-foreground">click the link</strong> to activate your
                  account.
                </p>

                {!supabaseReady && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
                    <AlertCircle className="size-4 shrink-0 mt-0.5 text-warning" />
                    <span>
                      Supabase is not configured in this environment. Add{" "}
                      <code className="text-xs">VITE_SUPABASE_URL</code> and{" "}
                      <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to your{" "}
                      <code className="text-xs">.env</code> file, then restart the dev server.
                    </span>
                  </div>
                )}

                {(status === "verifying" || handlingEmailLink) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
                  >
                    <Loader2 className="size-4 animate-spin shrink-0" />
                    {message || "Verifying…"}
                  </motion.div>
                )}

                {isFailure && message && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{message}</span>
                  </motion.div>
                )}

                {/* Helpful steps */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      1
                    </span>
                    <span>Open your email inbox (check spam/junk too)</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      2
                    </span>
                    <span>
                      Click the <strong className="text-foreground">"Confirm your email"</strong>{" "}
                      link
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      3
                    </span>
                    <span>You&apos;ll be verified and redirected to your portal</span>
                  </div>
                </div>

                {/* Resend */}
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Didn&apos;t receive the email?
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={
                      resending ||
                      handlingEmailLink ||
                      cooldown > 0 ||
                      !email.trim() ||
                      !supabaseReady
                    }
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition disabled:opacity-50"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending…
                      </>
                    ) : cooldown > 0 ? (
                      <>Resend available in {cooldown}s</>
                    ) : (
                      <>
                        <RefreshCw className="size-4" />
                        Resend verification email
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Wrong address?{" "}
                  <Link to="/register" className="text-primary font-semibold hover:underline">
                    Register again
                  </Link>
                  {" · "}
                  <Link
                    to="/login"
                    search={{ intent: "portal" }}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
