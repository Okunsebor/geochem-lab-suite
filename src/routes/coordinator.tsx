import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { CoordinatorSidebar } from "@/components/layout/CoordinatorSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { useAuth } from "@/hooks/use-auth";
import { getVerifyEmailPath } from "@/lib/auth-routes";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { mapDbRoleToUi, isEmailConfirmed } from "@/lib/auth-utils";

const COORDINATOR_ROLES = ["Lab Coordinator"] as const;

export const Route = createFileRoute("/coordinator")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;

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

    const rawRole: string | null =
      profile?.role ?? session.user.user_metadata?.role ?? null;

    if (!rawRole) {
      throw redirect({ to: "/login" });
    }

    const role = mapDbRoleToUi(rawRole);

    if (role === "Customer") {
      throw redirect({ to: "/portal" });
    } else if (role === "Admin") {
      throw redirect({ to: "/app" });
    } else if (!COORDINATOR_ROLES.includes(role as any)) {
      throw redirect({ to: "/login" });
    }
  },
  component: CoordinatorLayout,
});

function CoordinatorLayout() {
  const { currentUser, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => (s.resolvedLocation || s.location).pathname });

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-[10px] uppercase font-mono tracking-widest text-primary font-bold">
          Loading coordinator workspace?
        </p>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <CoordinatorSidebar />
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
