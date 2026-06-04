import type { User } from "@/types";

const RESEND_STORAGE_KEY = "gcs_verification_resend";
export const RESEND_COOLDOWN_SECONDS = 5 * 60;
export const MAX_RESENDS_PER_HOUR = 5;

interface ResendRecord {
  timestamps: number[];
  lastSentAt: number | null;
}

function readResendRecord(email: string): ResendRecord {
  try {
    const raw = localStorage.getItem(`${RESEND_STORAGE_KEY}:${email.toLowerCase()}`);
    if (!raw) return { timestamps: [], lastSentAt: null };
    return JSON.parse(raw) as ResendRecord;
  } catch {
    return { timestamps: [], lastSentAt: null };
  }
}

function writeResendRecord(email: string, record: ResendRecord): void {
  localStorage.setItem(`${RESEND_STORAGE_KEY}:${email.toLowerCase()}`, JSON.stringify(record));
}

/** Seconds until the user may resend a verification email (0 = allowed). */
export function getVerificationResendCooldown(email: string): number {
  const record = readResendRecord(email);
  if (!record.lastSentAt) return 0;
  const elapsed = (Date.now() - record.lastSentAt) / 1000;
  return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
}

/** Throws if resend is rate-limited. */
export function assertCanResendVerification(email: string): void {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("Email address is required.");

  const cooldown = getVerificationResendCooldown(normalized);
  if (cooldown > 0) {
    throw new Error(`Please wait ${cooldown} seconds before requesting another email.`);
  }

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recent = readResendRecord(normalized).timestamps.filter((t) => t > oneHourAgo);
  if (recent.length >= MAX_RESENDS_PER_HOUR) {
    throw new Error("Too many verification requests. Please try again in an hour.");
  }
}

export function recordVerificationResend(email: string): void {
  const normalized = email.trim().toLowerCase();
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const record = readResendRecord(normalized);
  const timestamps = [...record.timestamps.filter((t) => t > oneHourAgo), now];
  writeResendRecord(normalized, { timestamps, lastSentAt: now });
}

export function getAuthRedirectBase(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function getVerifyEmailUrl(): string {
  return `${getAuthRedirectBase()}/verify-email`;
}

export function isEmailConfirmed(
  user: { email_confirmed_at?: string | null } | null | undefined,
): boolean {
  return Boolean(user?.email_confirmed_at);
}

export function mapDbRoleToUi(role: string): User["role"] {
  switch (role?.toLowerCase()) {
    case "admin":
      return "Admin";
    case "manager":
      return "Lab Coordinator";
    case "technician":
      // WBS groups Lab Coordinator / Lab Staff; treat both as Lab Coordinator in the UI
      return "Lab Coordinator";
    case "customer":
    default:
      return "Customer";
  }
}

export function mapUiRoleToDb(role: User["role"]): string {
  switch (role) {
    case "Admin":
      return "admin";
    case "Lab Coordinator":
      return "manager";
    case "Customer":
    default:
      return "customer";
  }
}

export function formatAuthError(error: unknown): string {
  if (!error) return "An unexpected error occurred.";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("Invalid login credentials")) {
      return "Invalid email or password. Please check your credentials and try again.";
    }
    if (msg.includes("Email not confirmed")) {
      return "Please verify your email address before signing in.";
    }
    if (msg.includes("User already registered")) {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (msg.includes("Password should be at least")) {
      return "Password must be at least 8 characters long.";
    }
    if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429")) {
      return "Too many email requests. Wait a few minutes, then try again.";
    }
    if (msg.includes("signup_disabled") || msg.includes("Signups not allowed")) {
      return "New signups are disabled in Supabase. Enable signups under Authentication → Providers → Email.";
    }
    if (msg.includes("not authorized")) {
      return "This email cannot receive messages from the default Supabase mailer. Configure custom SMTP in your Supabase project.";
    }
    if (msg.includes("otp_expired") || msg.includes("expired")) {
      return "This verification link has expired. Please request a new verification email.";
    }
    if (msg.includes("otp_disabled")) {
      return "Email verification is not enabled. Please contact support.";
    }
    if (msg.includes("invalid") && (msg.includes("token") || msg.includes("otp"))) {
      return "The verification link is invalid. Please request a new verification email.";
    }
    if (msg.includes("Error sending confirmation email")) {
      return "Supabase could not send the confirmation email. Check Auth email/SMTP settings in your Supabase dashboard.";
    }
    return msg;
  }
  return "An unexpected error occurred.";
}

export const DEMO_MODE_ENABLED = false;
