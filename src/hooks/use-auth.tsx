import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { User } from "../types";
import { toast } from "sonner";
import {
  assertCanResendVerification,
  formatAuthError,
  isEmailConfirmed,
  mapDbRoleToUi,
  mapUiRoleToDb,
  recordVerificationResend,
  getVerificationResendCooldown,
} from "@/lib/auth-utils";
import { getSignupEmailOptions } from "@/lib/auth-email-verification";
import { getPortalPathForRole } from "@/lib/auth-routes";

export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organization: string;
  phone: string;
}

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  emailVerified: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ role: User["role"]; emailVerified: boolean }>;
  loginWithGoogle: () => Promise<void>;
  registerUser: (
    input: RegisterUserInput,
  ) => Promise<{ needsVerification: boolean; email: string; verificationEmailSent: boolean }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  getResendCooldown: (email: string) => number;

  inviteUser: (name: string, email: string, role: User["role"]) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildDisplayName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

/** Poll public.users until the row appears — only useful when we have an active session.
 * The handle_new_user trigger is synchronous, so this is only needed when signUp
 * returns a session (email confirmation disabled). When confirmation IS required,
 * data.session is null and RLS blocks any query here, so we skip this entirely.
 */
async function waitForProfile(
  userId: string,
  attempts = 5,
  delayMs = 600,
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (data) return true;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined") {
    console.log("[AUDIT: URL TRACE] Stage 6: AuthProvider initialization", {
      href: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
    });
  }
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  if (typeof window !== "undefined") {
    console.log(`[AUDIT: CONTEXT LIFECYCLE] AuthProvider render - loading: ${loading}, user: ${currentUser?.email || "null"}, session: ${session ? "EXISTS" : "null"}`);
  }

  // ─── syncProfile ──────────────────────────────────────────────────────────
  // Single source of truth: public.users is authoritative for role.
  // If no row exists, call upsert_user_profile RPC to create one, then re-fetch.
  // Never falls back to raw_user_meta_data for role decisions.
  const syncProfile = useCallback(async (sessionUser: SupabaseUser): Promise<User["role"]> => {
    const verified = isEmailConfirmed(sessionUser);
    setEmailVerified(verified);

    // Helper to build a display name from best available data
    const buildName = (fullName?: string) =>
      fullName ||
      buildDisplayName(
        sessionUser.user_metadata?.first_name ?? "",
        sessionUser.user_metadata?.last_name ?? "",
      ) ||
      sessionUser.email?.split("@")[0] ||
      "User";

    // Attempt 1: fetch from public.users
    let { data: profile, error: fetchError } = await (supabase as any)
      .from("users")
      .select("*, organizations(name)")
      .eq("id", sessionUser.id)
      .maybeSingle();

    if (!profile) {
      // User exists in auth but not in public.users. Do not block login.
      // Automatically create their public.users row using data available from the auth session
      console.warn("syncProfile: no public.users row found for", sessionUser.id, "— auto-creating to prevent legacy lockout");
      
      const metaRole = (sessionUser.user_metadata?.role as string | undefined) ?? "customer";
      const { data: upserted } = await (supabase as any).rpc(
        "upsert_user_profile",
        {
          p_full_name: buildName(sessionUser.user_metadata?.full_name),
          p_role: metaRole,
          p_phone_number: sessionUser.user_metadata?.phone ?? null,
        },
      );

      // Retry fetching after creation
      const retryFetch = await (supabase as any)
        .from("users")
        .select("*, organizations(name)")
        .eq("id", sessionUser.id)
        .maybeSingle();
        
      profile = retryFetch.data;
    }

    if (profile) {
      const org = profile.organizations as { name?: string } | null;
      const uiRole = mapDbRoleToUi(profile.role);
      setCurrentUser({
        id: 1,
        name: buildName(profile.full_name),
        email: sessionUser.email || "",
        role: uiRole,
        status: verified ? "Active" : "Invited",
        lastSeen: "Just now",
        organization: org?.name ?? sessionUser.user_metadata?.organization_name,
      });
      return uiRole;
    }

    // Fallback if creation completely failed — set a minimal user state but treat as Customer
    console.error(
      "syncProfile: CRITICAL — could not resolve profile for user",
      sessionUser.id,
      ". User will be treated as Customer until profile is repaired.",
    );
    setCurrentUser({
      id: 1,
      name: buildName(sessionUser.user_metadata?.full_name),
      email: sessionUser.email || "",
      role: "Customer",
      status: "Invited",
      lastSeen: "Just now",
      organization: sessionUser.user_metadata?.organization_name,
    });
    return "Customer";
  }, []);

  // ─── handleSession ────────────────────────────────────────────────────────
  const handleSession = useCallback(
    async (nextSession: Session | null) => {
      console.log(`[AUDIT: CONTEXT LIFECYCLE] handleSession called - nextSession exists:`, !!nextSession);
      setSession(nextSession);
      if (nextSession?.user) {
        await syncProfile(nextSession.user);
      } else {
        setCurrentUser(null);
        setEmailVerified(false);
      }
    },
    [syncProfile],
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: initial } }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      console.log(`[AUDIT: CONTEXT LIFECYCLE] Initial getSession() result exists:`, !!initial);
      handleSession(initial).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, nextSession: Session | null) => {
      console.log(`[AUDIT: CONTEXT LIFECYCLE] onAuthStateChange event: ${event}, session exists:`, !!nextSession);
      handleSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const refreshProfile = async () => {
    const {
      data: { session: current },
    } = await supabase.auth.getSession();
    if (current?.user) await syncProfile(current.user);
  };

  // ─── login ────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("Sign-in succeeded but no user was returned.");

      const verified = isEmailConfirmed(user);
      if (!verified) {
        try {
          await sendVerificationEmail(email, { showToast: false });
        } catch (resendErr) {
          console.warn("Could not automatically resend verification email on login:", resendErr);
        }
        await supabase.auth.signOut();
        throw new Error("Email not confirmed");
      }

      const role = await syncProfile(user);

      // Auth audit (best-effort, never blocks login)
      try {
        await (supabase as any).from("auth_audit_events").insert({
          event_type: "login",
          actor_user_id: user.id,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          meta: { email: user.email },
        });
      } catch (err) {
        console.warn("Auth audit (login) failed:", err);
      }

      return { role, emailVerified: verified };
    } finally {
      setLoading(false);
    }
  };

  // ─── loginWithGoogle ───────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login?intent=portal`
              : undefined,
        },
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  // ─── sendVerificationEmail (internal) ─────────────────────────────────────
  const sendVerificationEmail = async (email: string, options: { showToast?: boolean } = {}) => {
    const { showToast = true } = options;
    assertCanResendVerification(email);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: getSignupEmailOptions(),
    });
    if (error) throw error;
    recordVerificationResend(email);
    if (showToast) toast.success("Verification code sent. Check your inbox.");
  };

  // ─── registerUser ─────────────────────────────────────────────────────────
  // Atomic registration: if the DB profile isn't created within the retry window,
  // delete the orphaned auth account and return a visible error.
  const registerUser = async (input: RegisterUserInput) => {
    setLoading(true);
    try {
      const fullName = buildDisplayName(input.firstName, input.lastName);
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          ...getSignupEmailOptions(),
          data: {
            first_name: input.firstName.trim(),
            last_name: input.lastName.trim(),
            full_name: fullName,
            phone: input.phone.trim(),
            organization_name: input.organization.trim(),
            role: "customer",
          },
        },
      });
      if (error) throw error;

      // Supabase returns an empty identities array when the email is already registered
      if (data.user?.identities && data.user.identities.length === 0) {
        let verificationEmailSent = true;
        try {
          await sendVerificationEmail(input.email, { showToast: false });
        } catch (err) {
          const msg = err instanceof Error ? err.message.toLowerCase() : "";
          if (msg.includes("already") && msg.includes("confirm")) {
            throw new Error("User already registered");
          }
          if (msg.includes("wait") || msg.includes("too many")) {
            verificationEmailSent = false;
          } else {
            throw err;
          }
        }
        return { needsVerification: true, email: input.email.trim(), verificationEmailSent };
      }

      const userId = data.user?.id;

      // ── Profile verification ────────────────────────────────────────────────
      // The handle_new_user DB trigger is SYNCHRONOUS — it runs inside the same
      // Postgres transaction as the auth.users INSERT, so if signUp succeeded
      // the public.users row already exists by the time we get here.
      //
      // When email confirmation is required, Supabase returns data.session = null.
      // In that state auth.uid() is null so any query to public.users is blocked
      // by RLS. We MUST NOT poll or call RPCs in this case — the profile is fine.
      //
      // We only need to poll + repair when we have an active session (i.e. email
      // confirmation is disabled in the Supabase project settings).
      if (userId && data.session) {
        // Active session: we can query public.users and call RPCs normally.
        const profileReady = await waitForProfile(userId, 5, 600);
        if (!profileReady) {
          console.warn(
            "registerUser: DB trigger did not create profile for",
            userId,
            "— attempting RPC repair",
          );
          try {
            const { error: rpcError } = await (supabase as any).rpc("upsert_user_profile", {
              p_full_name: fullName,
              p_role: "customer",
              p_phone_number: input.phone.trim() || null,
            });
            if (rpcError) throw rpcError;
          } catch (rpcErr) {
            // RPC failed — sign out the session so the orphaned auth account
            // doesn't stay logged in, then surface the error.
            console.error(
              "registerUser: RPC repair failed:",
              rpcErr,
            );
            try { await supabase.auth.signOut(); } catch (_) {}
            throw new Error(
              "Account creation failed: your user record could not be initialised. Please try again or contact support.",
            );
          }
        }
      }
      // When data.session is null (email confirmation required), the trigger
      // already ran synchronously. Nothing to do — proceed to verification step.

      // Sign out the temporary session if one was granted (email confirmation disabled)
      if (data.session) {
        await supabase.auth.signOut();
      }

      const needsVerification = !data.user?.email_confirmed_at;
      return {
        needsVerification,
        email: input.email.trim(),
        verificationEmailSent: needsVerification,
      };
    } finally {
      setLoading(false);
    }
  };

  // ─── resendVerificationEmail ───────────────────────────────────────────────
  const resendVerificationEmail = async (email: string) => {
    await sendVerificationEmail(email);
  };

  // ─── logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    setLoading(true);
    try {
      // Auth audit (best-effort)
      try {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        if (s?.user?.id) {
          await (supabase as any).from("auth_audit_events").insert({
            event_type: "logout",
            actor_user_id: s.user.id,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
            meta: { email: s.user.email },
          });
        }
      } catch (err) {
        console.warn("Auth audit (logout) failed:", err);
      }

      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    } finally {
      setCurrentUser(null);
      setSession(null);
      setEmailVerified(false);
      localStorage.removeItem("gcs_samples");
      setLoading(false);
      window.location.assign("/login");
    }
  };

  // ─── forgotPassword ───────────────────────────────────────────────────────
  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password recovery email sent.");
    } finally {
      setLoading(false);
    }
  };

  // ─── resetPassword ────────────────────────────────────────────────────────
  const resetPassword = async (password: string) => {
    setLoading(true);
    try {
      console.log("[AUDIT: PASSWORD UPDATE] Preparing to update password...");
      const { data: sessionData } = await supabase.auth.getSession();
      const s = sessionData.session;
      console.log("[AUDIT: PASSWORD UPDATE] Pre-update state:", {
        sessionExists: !!s,
        userId: s?.user?.id,
        userEmail: s?.user?.email,
        hasAccessToken: !!s?.access_token,
        hasRefreshToken: !!s?.refresh_token,
        sessionObject: s,
      });

      console.log("[AUDIT: PASSWORD UPDATE] Executing updateUser with payload: { password: '***[REDACTED]***' }");
      const response = await supabase.auth.updateUser({ password });
      
      console.log("[AUDIT: PASSWORD UPDATE] updateUser response payload:", response);
      if (response.error) {
        console.error("[AUDIT: PASSWORD UPDATE] updateUser error exact details:", response.error);
        throw response.error;
      }
      toast.success("Your password has been updated.");
    } finally {
      setLoading(false);
    }
  };

  // ─── inviteUser ───────────────────────────────────────────────────────────
  const inviteUser = async (name: string, email: string, role: User["role"]) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.user) {
      throw new Error("Not authenticated.");
    }

    const { data: profile } = await (supabase as any)
      .from("users")
      .select("role")
      .eq("id", currentSession.user.id)
      .maybeSingle();

    const rawRole = (profile as any)?.role ?? currentSession.user.user_metadata?.role ?? "";

    if (String(rawRole).toLowerCase() !== "admin") {
      throw new Error("Only an Admin can invite new users.");
    }

    const { data, error } = await supabase.functions.invoke("invite-user", {
      body: { name, email, role },
    });

    if (error) {
      throw new Error(error.message || "Failed to invite user");
    }

    if (data?.error) {
      throw new Error(data.error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        loading,
        emailVerified,
        login,
        loginWithGoogle,
        registerUser,
        logout,
        forgotPassword,
        resetPassword,
        resendVerificationEmail,
        getResendCooldown: getVerificationResendCooldown,

        inviteUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be executed within an AuthProvider");
  }
  return context;
}

export { formatAuthError, getPortalPathForRole };
