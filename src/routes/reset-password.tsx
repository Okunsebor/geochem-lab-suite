import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import React, { useState } from "react";
import { useAuth, formatAuthError } from "../hooks/use-auth";
import { InputField } from "../components/shared/form-controls";
import { toast } from "sonner";
import { BRAND_ASSETS } from "@/lib/branding";
import { UniPodLogo } from "@/components/branding/UniPodLogo";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const search: any = Route.useSearch();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  
  const isExpired = search.error === "access_denied" || search.error_code === "otp_expired";
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(password);
      setSuccess(true);
      toast.success("Password set successfully.");
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 3000);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden">
        <img
          src={BRAND_ASSETS.entrance}
          alt="UniPod Nsuk"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="relative flex flex-col justify-between p-10 min-h-full text-white">
          <UniPodLogo height={36} linkToHome showTagline />
          <blockquote className="text-xl leading-snug max-w-md">
            &ldquo;Precision geochemistry for exploration and mining — from UniPod Nsuk.&rdquo;
          </blockquote>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
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

            {success ? (
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
