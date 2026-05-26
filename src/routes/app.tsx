import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/lims/app-sidebar";
import { AppTopbar } from "@/components/lims/app-topbar";
import { supabaseHelpers } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Beaker } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabaseHelpers.healthCheck();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        navigate({ to: "/login" });
      } else if (currentUser.role === "Customer") {
        toast.error("Access Denied: Customers are restricted to the Customer Portal.");
        navigate({ to: "/portal" });
      }
    }
  }, [loading, currentUser, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Beaker className="size-8 text-primary animate-pulse mx-auto" />
          <p className="text-xs text-muted-foreground font-semibold">Synchronizing LIMS secure session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen w-full bg-background animate-in fade-in duration-300">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
