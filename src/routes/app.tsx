import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabaseHelpers } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { getVerifyEmailPath } from "@/lib/auth-routes";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { mapDbRoleToUi, isEmailConfirmed } from "@/lib/auth-utils";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session?.user) {
      throw redirect({ to: "/login" });
    }

    if (!isEmailConfirmed(session.user)) {
      throw redirect({ href: getVerifyEmailPath(session.user.email) });
    }

    const { data: profile } = await supabase
      .from("users" as any)
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    // Use the DB profile as the authoritative source.
    // If the profile query returned null (RLS timing race or session not yet
    // propagated to the DB connection), fall back to session metadata which
    // is always present in the JWT. Only redirect to login if both are absent.
    const rawRole: string | null =
      profile?.role ?? session.user.user_metadata?.role ?? null;

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  if (!currentUser) return null;

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
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
            className="will-change-[transform,opacity]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
