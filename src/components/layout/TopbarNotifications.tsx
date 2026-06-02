import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLimsState } from "@/hooks/use-lims-state";

export function TopbarNotifications() {
  const { unreadNotificationCount, currentUser } = useLimsState();
  const notificationsPath =
    currentUser?.role === "Lab Coordinator"
      ? "/coordinator/notifications"
      : currentUser?.role === "Customer"
        ? "/portal/notifications"
        : "/app/notifications";

  return (
    <Link to={notificationsPath as any} className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
      <Bell className="size-4" />
      {unreadNotificationCount > 0 && (
        <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
          {unreadNotificationCount}
        </span>
      )}
    </Link>
  );
}
