import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { User } from "../types";
import { toast } from "sonner";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  registerUser: (email: string, password: string, name: string, role: User["role"], orgName?: string) => Promise<any>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  switchUserRole: (role: User["role"]) => void;
  inviteUser: (name: string, email: string, role: User["role"]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map DB roles to UI roles
const mapDbRoleToUi = (role: string): User["role"] => {
  switch (role?.toLowerCase()) {
    case "admin":
      return "Admin";
    case "manager":
      return "Lab Coordinator";
    case "technician":
      return "Lab Staff";
    case "customer":
    default:
      return "Customer";
  }
};

// Helper to map UI roles to DB roles
const mapUiRoleToDb = (role: User["role"]): string => {
  switch (role) {
    case "Admin":
      return "admin";
    case "Lab Coordinator":
      return "manager";
    case "Lab Staff":
      return "technician";
    case "Customer":
    default:
      return "customer";
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile from auth session
  const syncProfile = async (sessionUser: any) => {
    if (!sessionUser) {
      setCurrentUser(null);
      return;
    }

    try {
      // Attempt to fetch profile from the PostgreSQL public.users table
      const { data: profile, error } = await supabase
        .from("users" as any)
        .select("*, organizations(*)")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        setCurrentUser({
          id: 1, // Keep numeric matching for mock LIMS structures
          name: profile.full_name || sessionUser.user_metadata?.full_name || "Adaeze Nwosu",
          email: sessionUser.email || "",
          role: mapDbRoleToUi(profile.role),
          status: "Active",
          lastSeen: "Just now",
        });
      } else {
        // Auto-create profile if missing in DB to remain robust
        const dbRole = mapUiRoleToDb(sessionUser.user_metadata?.role || "Admin");
        const fullName = sessionUser.user_metadata?.full_name || "Adaeze Nwosu";
        
        try {
          await supabase.from("users" as any).insert({
            id: sessionUser.id,
            full_name: fullName,
            role: dbRole,
          });
        } catch (insertErr) {
          console.warn("Could not auto-insert public user profile:", insertErr);
        }

        setCurrentUser({
          id: 1,
          name: fullName,
          email: sessionUser.email || "",
          role: sessionUser.user_metadata?.role || "Admin",
          status: "Active",
          lastSeen: "Just now",
        });
      }
    } catch (err: any) {
      console.warn("Postgres profile fetch bypassed, using auth metadata:", err.message);
      // Fallback sandbox resolution
      setCurrentUser({
        id: 1,
        name: sessionUser.user_metadata?.full_name || "Adaeze Nwosu",
        email: sessionUser.email || "",
        role: sessionUser.user_metadata?.role || "Admin",
        status: "Active",
        lastSeen: "Just now",
      });
    }
  };

  useEffect(() => {
    // 1. Get initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncProfile(session.user).then(() => setLoading(false));
      } else {
        // Fallback demo user checks if no active remote session
        const demoRole = localStorage.getItem("gcs_demo_role");
        if (demoRole) {
          const names: Record<string, string> = {
            "Admin": "Adaeze Nwosu",
            "Lab Coordinator": "M. Rivera",
            "Lab Staff": "Keiko Nakamura",
            "Customer": "Jane Smith",
          };
          setCurrentUser({
            id: 1,
            name: names[demoRole] || "Adaeze Nwosu",
            email: `${demoRole.toLowerCase().replace(" ", "")}@geochem.io`,
            role: demoRole as User["role"],
            status: "Active",
            lastSeen: "Just now",
          });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    });

    // 2. Listen to real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncProfile(session.user).then(() => setLoading(false));
      } else {
        const demoRole = localStorage.getItem("gcs_demo_role");
        if (!demoRole) {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    localStorage.removeItem("gcs_demo_role");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (email: string, password: string, name: string, role: User["role"], orgName?: string) => {
    setLoading(true);
    localStorage.removeItem("gcs_demo_role");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          },
        },
      });
      if (error) throw error;

      // Safe creation of public org and profile on database if session is immediate
      if (data?.user) {
        try {
          let orgId = null;
          if (orgName) {
            const { data: orgData } = await supabase
              .from("organizations" as any)
              .insert({ name: orgName })
              .select()
              .single();
            orgId = orgData?.id;
          }

          await supabase.from("users" as any).insert({
            id: data.user.id,
            full_name: name,
            role: mapUiRoleToDb(role),
            organization_id: orgId,
          });
        } catch (dbErr) {
          console.warn("Public profile write skipped during signup:", dbErr);
        }
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem("gcs_demo_role");
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error, completing local logout:", err);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem("gcs_samples");
      setLoading(false);
      window.location.href = "/login";
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password recovery email dispatched successfully!");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Your credentials have been securely updated!");
    } finally {
      setLoading(false);
    }
  };

  const switchUserRole = (role: User["role"]) => {
    localStorage.setItem("gcs_demo_role", role);
    const names: Record<string, string> = {
      "Admin": "Adaeze Nwosu",
      "Lab Coordinator": "M. Rivera",
      "Lab Staff": "Keiko Nakamura",
      "Customer": "Jane Smith",
    };
    setCurrentUser({
      id: 1,
      name: names[role] || "Adaeze Nwosu",
      email: `${role.toLowerCase().replace(" ", "")}@geochem.io`,
      role,
      status: "Active",
      lastSeen: "Just now",
    });
  };

  const inviteUser = async (name: string, email: string, role: User["role"]) => {
    // Simulates dynamic invite and registers in DB users profile if possible
    try {
      // In production LIMS context, this would invoke a Supabase edge function or invite API
      console.log(`Dispatched workspace invite for ${email} with role ${role}`);
    } catch (err) {
      console.warn("Bypassed real invite, running inside local memory", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        registerUser,
        logout,
        forgotPassword,
        resetPassword,
        switchUserRole,
        inviteUser,
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
