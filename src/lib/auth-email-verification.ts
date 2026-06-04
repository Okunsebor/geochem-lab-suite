import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getVerifyEmailUrl } from "@/lib/auth-utils";

export type EmailVerificationCallback =
  | { kind: "token_hash"; token_hash: string; type: EmailOtpType }
  | { kind: "pkce_code"; code: string }
  | { kind: "none" };

/** Parse Supabase auth callback params from the current page URL (query + hash). */
export function parseEmailVerificationCallback(): EmailVerificationCallback {
  if (typeof window === "undefined") return { kind: "none" };

  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#")
    ? new URLSearchParams(window.location.hash.slice(1))
    : new URLSearchParams();

  const token_hash = search.get("token_hash") ?? hash.get("token_hash");
  const type = (search.get("type") ?? hash.get("type")) as EmailOtpType | null;
  if (token_hash && type) {
    return { kind: "token_hash", token_hash, type };
  }

  const code = search.get("code") ?? hash.get("code");
  if (code) {
    return { kind: "pkce_code", code };
  }

  return { kind: "none" };
}

/** Remove auth callback params from the address bar after handling. */
export function clearAuthCallbackFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const strip = [
    "token_hash",
    "type",
    "code",
    "access_token",
    "refresh_token",
    "expires_in",
    "token_type",
    "error",
    "error_description",
  ];
  strip.forEach((key) => url.searchParams.delete(key));
  url.hash = "";
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
}

/**
 * Complete verification when the user opens the link from their email.
 * Returns true if a session was established.
 */
export async function completeEmailVerificationFromUrl(): Promise<boolean> {
  const callback = parseEmailVerificationCallback();
  if (callback.kind === "none") return false;

  if (callback.kind === "pkce_code") {
    const { data, error } = await supabase.auth.exchangeCodeForSession(callback.code);
    if (error) throw error;
    clearAuthCallbackFromUrl();
    return Boolean(data.session);
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: callback.token_hash,
    type: callback.type,
  });
  if (error) throw error;
  clearAuthCallbackFromUrl();
  return Boolean(data.session);
}

/** Options passed to signUp / resend so Supabase emails link back to this app. */
export function getSignupEmailOptions() {
  return {
    emailRedirectTo: getVerifyEmailUrl(),
  };
}

export function isSupabaseConfigured(): boolean {
  const url =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
    process.env.SUPABASE_URL ||
    "";
  const key =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  if (!url || !key) return false;
  if (url.includes("your-project-id")) return false;
  if (key.length < 50) return false;
  return true;
}
