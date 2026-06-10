import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabaseHelpers } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { getVerifyEmailPath } from "@/lib/auth-routes";
import { motion } from "framer-motion";
import { mapDbRoleToUi, isEmailConfirmed } from "@/lib/auth-utils";

import { getSessionFromServer, getUserProfileFromServer } from "@/lib/auth-server";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    let session = null;
    let rawRole: string | null = null;
    let emailConfirmed = false;
    let email: string | undefined = undefined;

    if (typeof window !== "undefined") {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      session = data.session;
      if (session?.user) {
        email = session.user.email;
        emailConfirmed = isEmailConfirmed(session.user);
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();
        rawRole = (profile as any)?.role ?? session.user.user_metadata?.role ?? null;
      }
    } else {
      const { session: serverSession, error } = await getSessionFromServer();
      if (!error && serverSession?.user) {
        session = serverSession;
        email = session.user.email;
        emailConfirmed = isEmailConfirmed(session.user);
        const { profile } = await getUserProfileFromServer();
        rawRole = profile?.role ?? session.user.user_metadata?.role ?? null;
      }
    }

    if (!session?.user) {
      throw redirect({ to: "/login" });
    }

    if (!emailConfirmed) {
      throw redirect({ href: getVerifyEmailPath(email) });
    }

    if (!rawRole) {
      throw redirect({ to: "/login" });
    }

    const role = mapDbRoleToUi(rawRole);

    if (role === "Customer") {
      throw redirect({ to: "/portal" });
    } else if (role === "Lab Coordinator") {
      throw redirect({ to: "/coordinator" });
    } else if (role !== "Admin") {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { currentUser, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => (s.resolvedLocation || s.location).pathname });

  useEffect(() => {
    supabaseHelpers.healthCheck();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="lims-orbit-container mx-auto">
            <div className="lims-orbit-ring" />
            <div className="lims-orbit-ring" />
            <div className="lims-orbit-ring" />
          </div>
          <div className="space-y-2">
            <div className="dna-helix-container mx-auto">
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
            </div>
            <p className="text-[9px] uppercase font-mono tracking-widest text-primary font-bold">
              Synchronizing Secure LIMS Session
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-[10px] uppercase font-mono tracking-widest text-primary font-bold">
          Loading workspace…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 px-4 py-6 lg:px-8 overflow-x-hidden">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
