import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabaseHelpers } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabaseHelpers.healthCheck();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        navigate({ to: "/login", search: {} });
      } else if (currentUser.role === "Customer") {
        toast.error("Please use your registered customer portal.");
        navigate({ to: "/portal" });
      } else if (currentUser.role === "Lab Coordinator" || currentUser.role === "Lab Staff") {
        toast.info("Redirected to the Lab Coordinator portal.");
        window.location.href = "/coordinator";
      } else if (currentUser.role !== "Admin") {
        navigate({ to: "/login", search: {} });
      }
    }
  }, [loading, currentUser, navigate]);

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
            <p className="text-[9px] uppercase font-mono tracking-widest text-primary font-bold">Synchronizing Secure LIMS Session</p>
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
