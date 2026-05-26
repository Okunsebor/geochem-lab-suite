import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/lims/app-sidebar";
import { AppTopbar } from "@/components/lims/app-topbar";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
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
