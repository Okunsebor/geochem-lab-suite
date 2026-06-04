import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { useAuth } from "../../../hooks/use-auth";
import { InputField } from "../../../components/shared/form-controls";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
      toast.success("Security reset link dispatched successfully!");
    } catch (err: any) {
      console.warn("Real Auth password recovery failed:", err.message);
      toast.error(err.message || "Failed to trigger recovery. Verify address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-card p-6 sm:p-8 rounded-xl border border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="grid size-8 place-items-center rounded-md gradient-primary text-white">
          <KeyRound className="size-4" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Recover credentials</h1>
      </div>

      {!submitted ? (
        <>
          <p className="text-xs text-muted-foreground font-medium mb-6">
            Enter your registered email address and we'll dispatch a link to reset your secure LIMS
            password.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <InputField
              label="Work email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="size-4 text-muted-foreground" />}
              placeholder="you@geochem.io"
              disabled={loading}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md gradient-primary px-3 py-2 text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Dispatching...
                </>
              ) : (
                "Request reset link"
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-xs text-success font-medium">
            A secure verification link has been successfully dispatched to{" "}
            <strong className="text-foreground">{email}</strong>. Please verify your inbox and
            follow instructions to update credentials.
          </div>
          <p className="text-xs text-muted-foreground font-medium text-center">
            Didn't receive email? Check spam filters or try requesting another link.
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground font-semibold">
        <Link to="/login" className="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="size-3.5" /> Back to login
        </Link>
      </p>
    </div>
  );
}
