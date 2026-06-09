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
  console.log("[AUDIT: AUTH FLOW] Step 1: URL code extraction. Extracted callback:", callback);
  if (callback.kind === "none") {
    console.log("[AUDIT: AUTH FLOW] Step 1.1: No code/token found in URL.");
    return false;
  }

  if (callback.kind === "pkce_code") {
    console.log("[AUDIT: AUTH FLOW] Step 2: exchangeCodeForSession() request for code:", callback.code);
    const { data, error } = await supabase.auth.exchangeCodeForSession(callback.code);
    console.log("[AUDIT: AUTH FLOW] Step 3: exchangeCodeForSession() response. Data:", data, "Error:", error);
    if (error) {
      console.error("[AUDIT: AUTH FLOW] Supabase exchange error exact details:", error);
      throw error;
    }
    console.log("[AUDIT: AUTH FLOW] Step 4 & 5: Session creation and persistence check.");
    console.log("[AUDIT: AUTH FLOW] Access token received:", data?.session?.access_token);
    console.log("[AUDIT: AUTH FLOW] Refresh token received:", data?.session?.refresh_token);
    console.log("[AUDIT: AUTH FLOW] Session object received:", data?.session);

    const checkSession = async (label: string) => {
      const s = await supabase.auth.getSession();
      console.log(`[AUDIT: PERSISTENCE] ${label}:`, s.data.session ? "EXISTS" : "LOST", s.data.session);
    };

    await checkSession("Immediately after exchange");
    setTimeout(() => checkSession("After 1 second"), 1000);
    setTimeout(() => checkSession("After 3 seconds"), 3000);

    clearAuthCallbackFromUrl();
    return Boolean(data?.session);
  }

  console.log("[AUDIT: AUTH FLOW] Step 2: verifyOtp() request for token_hash:", callback.token_hash);
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: callback.token_hash,
    type: callback.type,
  });
  console.log("[AUDIT: AUTH FLOW] Step 3: verifyOtp() response. Data:", data, "Error:", error);
  if (error) {
    console.error("[AUDIT: AUTH FLOW] Supabase verifyOtp error exact details:", error);
    throw error;
  }
  console.log("[AUDIT: AUTH FLOW] Step 4 & 5: Session creation and persistence check.");
  console.log("[AUDIT: AUTH FLOW] Access token received:", data?.session?.access_token);
  console.log("[AUDIT: AUTH FLOW] Refresh token received:", data?.session?.refresh_token);
  console.log("[AUDIT: AUTH FLOW] Session object received:", data?.session);

  clearAuthCallbackFromUrl();
  return Boolean(data?.session);
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
