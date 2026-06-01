import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { CoordinatorSidebar } from "@/components/layout/CoordinatorSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { useAuth } from "@/hooks/use-auth";
import { getVerifyEmailPath } from "@/lib/auth-routes";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/coordinator")({
  component: CoordinatorLayout,
});

const COORDINATOR_ROLES = ["Lab Coordinator", "Lab Staff"] as const;

function CoordinatorLayout() {
  const { currentUser, loading, emailVerified, session } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        navigate({ to: "/login", search: {} });
      } else if (session && !emailVerified) {
        toast.info("Verify your email before accessing the coordinator workspace.");
        window.location.href = getVerifyEmailPath(currentUser.email);
      } else if (currentUser.role === "Customer") {
        toast.error("Customer accounts use the registered customer portal.");
        navigate({ to: "/portal" });
      } else if (currentUser.role === "Admin") {
        navigate({ to: "/app" });
      } else if (!COORDINATOR_ROLES.includes(currentUser.role as (typeof COORDINATOR_ROLES)[number])) {
        navigate({ to: "/login", search: {} });
      }
    }
  }, [loading, currentUser, emailVerified, session, navigate]);

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
            transition={{ duration: 0.28 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
