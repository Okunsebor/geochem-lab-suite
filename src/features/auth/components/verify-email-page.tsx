import React, { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { REGEXP_ONLY_DIGITS_AND_CHARS, OTPInput, OTPInputContext } from "input-otp";
import { useAuth, formatAuthError } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { UniPodLogo } from "@/components/branding/UniPodLogo";
import { UNIPOD_BRAND } from "@/lib/branding";
import { getPortalPathForRole } from "@/lib/auth-routes";
import { mapDbRoleToUi } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

type VerifyStatus = "pending" | "verifying" | "success" | "expired" | "invalid" | "error";

function OtpSlot(props: React.ComponentProps<"div"> & { index: number }) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[props.index] ?? {};

  return (
    <div
      className={cn(
        "relative flex h-12 w-10 items-center justify-center rounded-lg border border-border bg-background text-lg font-semibold transition-all",
        isActive && "border-primary ring-2 ring-primary/20 z-10",
        char && "border-primary/50 bg-primary/5"
      )}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-pulse bg-primary" />
        </div>
      )}
    </div>
  );
}

export function VerifyEmailPage({ initialEmail }: { initialEmail?: string }) {
  const {
    resendVerificationEmail,
    getResendCooldown,
    verifyEmailOtp,
    refreshProfile,
    currentUser,
    emailVerified,
  } = useAuth();

  const [email, setEmail] = useState(initialEmail ?? "");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<VerifyStatus>("pending");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [submittingOtp, setSubmittingOtp] = useState(false);

  const handleVerifiedRedirect = useCallback(async () => {
    setStatus("success");
    await refreshProfile();

    let role: User["role"] = "Customer";
    const { data: { session: active } } = await supabase.auth.getSession();
    if (active?.user) {
      const { data: profile } = await supabase
        .from("users" as any)
        .select("role")
        .eq("id", active.user.id)
        .maybeSingle();
      if (profile?.role) role = mapDbRoleToUi(profile.role);
      else if (active.user.user_metadata?.role) role = active.user.user_metadata.role;
    }

    setTimeout(() => {
      window.location.href = getPortalPathForRole(role);
    }, 2200);
  }, [refreshProfile]);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

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

  const handleResend = async () => {
    if (!email.trim()) {
      setMessage("Enter your email address to resend verification.");
      return;
    }
    setResending(true);
    setMessage("");
    try {
      await resendVerificationEmail(email);
      setCooldown(getResendCooldown(email));
    } catch (err) {
      setMessage(formatAuthError(err));
    } finally {
      setResending(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || otp.length < 6) return;

    setSubmittingOtp(true);
    setStatus("verifying");
    setMessage("");
    try {
      await verifyEmailOtp(email, otp);
      await handleVerifiedRedirect();
    } catch (err) {
      const msg = formatAuthError(err);
      if (msg.toLowerCase().includes("expired")) {
        setStatus("expired");
      } else if (msg.toLowerCase().includes("invalid")) {
        setStatus("invalid");
      } else {
        setStatus("error");
      }
      setMessage(msg);
    } finally {
      setSubmittingOtp(false);
    }
  };

  const isSuccess = status === "success";
  const isFailure = status === "expired" || status === "invalid" || status === "error";

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
                  Email verified
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your account is active. Redirecting to your customer dashboard?
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
                    transition={{ duration: 2, ease: "easeInOut" }}
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
                      UniPod GeoChem Suite ? Secure onboarding
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                  We sent a 6-digit verification code to your inbox. Enter it below to
                  activate your account.
                </p>

                {status === "verifying" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
                  >
                    <Loader2 className="size-4 animate-spin shrink-0" />
                    {message || "Verifying?"}
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

                <form className="mt-6 space-y-4" onSubmit={handleOtpSubmit}>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Mail className="size-3.5 text-muted-foreground" />
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">
                      Verification code
                    </label>
                    <OTPInput
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                      value={otp}
                      onChange={setOtp}
                      containerClassName="flex justify-center gap-2"
                      disabled={submittingOtp}
                    >
                      <div className="flex gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <OtpSlot key={i} index={i} />
                        ))}
                      </div>
                    </OTPInput>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingOtp || otp.length < 6 || !email.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {submittingOtp ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Verifying code?
                      </>
                    ) : (
                      <>
                        Verify & continue <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Didn&apos;t receive the email?
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || cooldown > 0 || !email.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition disabled:opacity-50"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending?
                      </>
                    ) : cooldown > 0 ? (
                      <>Resend available in {cooldown}s</>
                    ) : (
                      <>
                        <RefreshCw className="size-4" />
                        Resend verification code
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Wrong address?{" "}
                  <Link to="/register" className="text-primary font-semibold hover:underline">
                    Register again
                  </Link>
                  {" ? "}
                  <Link to="/login" search={{ intent: "portal" }} className="text-primary font-semibold hover:underline">
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
