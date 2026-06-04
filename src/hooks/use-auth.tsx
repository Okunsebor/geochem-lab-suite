import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { User } from "../types";
import { toast } from "sonner";
import {
  assertCanResendVerification,
  DEMO_MODE_ENABLED,
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

  switchUserRole: (role: User["role"]) => void;
  inviteUser: (name: string, email: string, role: User["role"]) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildDisplayName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncProfile = useCallback(async (sessionUser: SupabaseUser) => {
    const verified = isEmailConfirmed(sessionUser);
    setEmailVerified(verified);

    try {
      const { data: profile, error } = await supabase
        .from("users" as any)
        .select("*, organizations(name)")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        const org = profile.organizations as { name?: string } | null;
        setCurrentUser({
          id: 1,
          name:
            profile.full_name ||
            buildDisplayName(
              sessionUser.user_metadata?.first_name ?? "",
              sessionUser.user_metadata?.last_name ?? "",
            ) ||
            sessionUser.email?.split("@")[0] ||
            "User",
          email: sessionUser.email || "",
          role: mapDbRoleToUi(profile.role),
          status: verified ? "Active" : "Invited",
          lastSeen: "Just now",
          organization: org?.name ?? sessionUser.user_metadata?.organization_name,
        });
        return mapDbRoleToUi(profile.role);
      }

      const metaRole = sessionUser.user_metadata?.role as User["role"] | undefined;
      const uiRole =
        typeof metaRole === "string" && ["Admin", "Lab Coordinator", "Customer"].includes(metaRole)
          ? metaRole
          : mapDbRoleToUi(mapUiRoleToDb("Customer"));

      setCurrentUser({
        id: 1,
        name:
          sessionUser.user_metadata?.full_name ||
          buildDisplayName(
            sessionUser.user_metadata?.first_name ?? "",
            sessionUser.user_metadata?.last_name ?? "",
          ) ||
          "User",
        email: sessionUser.email || "",
        role: uiRole,
        status: verified ? "Active" : "Invited",
        lastSeen: "Just now",
        organization: sessionUser.user_metadata?.organization_name,
      });
      return uiRole;
    } catch (err) {
      console.warn("Profile sync fallback:", err);
      const metaRole = sessionUser.user_metadata?.role;
      const uiRole =
        metaRole === "Admin" || metaRole === "Lab Coordinator" || metaRole === "Customer"
          ? metaRole
          : "Customer";

      setCurrentUser({
        id: 1,
        name: sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
        email: sessionUser.email || "",
        role: uiRole,
        status: verified ? "Active" : "Invited",
        lastSeen: "Just now",
        organization: sessionUser.user_metadata?.organization_name,
      });
      return uiRole;
    }
  }, []);

  const handleSession = useCallback(
    async (nextSession: Session | null) => {
      setSession(nextSession);
      if (nextSession?.user) {
        await syncProfile(nextSession.user);
      } else if (DEMO_MODE_ENABLED) {
        const demoRole = localStorage.getItem("gcs_demo_role") as User["role"] | null;
        if (demoRole) {
          const names: Record<User["role"], string> = {
            Admin: "Adaeze Nwosu",
            "Lab Coordinator": "M. Rivera",
            Customer: "Jane Smith",
          };
          setCurrentUser({
            id: 1,
            name: names[demoRole] || "Demo User",
            email: `${demoRole.toLowerCase().replace(/\s+/g, "")}@geochem.io`,
            role: demoRole,
            status: "Active",
            lastSeen: "Just now",
          });
          setEmailVerified(true);
        } else {
          setCurrentUser(null);
          setEmailVerified(false);
        }
      } else {
        setCurrentUser(null);
        setEmailVerified(false);
      }
    },
    [syncProfile],
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (!mounted) return;
      handleSession(initial).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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

  const login = async (email: string, password: string) => {
    setLoading(true);
    localStorage.removeItem("gcs_demo_role");
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
        await supabase.from("auth_audit_events" as any).insert({
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

  const loginWithGoogle = async () => {
    setLoading(true);
    localStorage.removeItem("gcs_demo_role");
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

  const registerUser = async (input: RegisterUserInput) => {
    setLoading(true);
    localStorage.removeItem("gcs_demo_role");
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

      // Profile is provisioned by DB trigger; sign out so portal stays locked until verified
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

  const resendVerificationEmail = async (email: string) => {
    await sendVerificationEmail(email);
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem("gcs_demo_role");
    try {
      // Auth audit (best-effort)
      try {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        if (s?.user?.id) {
          await supabase.from("auth_audit_events" as any).insert({
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

  const resetPassword = async (password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Your password has been updated.");
    } finally {
      setLoading(false);
    }
  };

  const switchUserRole = (role: User["role"]) => {
    localStorage.setItem("gcs_demo_role", role);
    const names: Record<User["role"], string> = {
      Admin: "Adaeze Nwosu",
      "Lab Coordinator": "M. Rivera",
      Customer: "Jane Smith",
    };
    setCurrentUser({
      id: 1,
      name: names[role] || "Demo User",
      email: `${role.toLowerCase().replace(/\s+/g, "")}@geochem.io`,
      role,
      status: "Active",
      lastSeen: "Just now",
    });
    setEmailVerified(true);
  };

  const inviteUser = async (name: string, email: string, role: User["role"]) => {
    console.log(`Workspace invite queued for ${email} (${role}) — ${name}`);
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

        switchUserRole,
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
