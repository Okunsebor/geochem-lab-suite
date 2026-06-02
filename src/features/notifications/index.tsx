import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLimsState } from "@/hooks/use-lims-state";
import { Bell, CheckCheck, Mail, MessageSquare, ShieldAlert, Workflow } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsFeature() {
  const {
    notifications = [],
    notificationsLoading,
    unreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
    currentUser,
    settings,
    updateSettings,
  } = useLimsState();
  const navigate = useNavigate();
  const role = currentUser?.role || "Customer";

  const handleNotificationClick = (title: string) => {
    // Extract Sample ID (e.g. GCS-24004) if it exists
    const sampleMatch = title.match(/GCS-\d+/);
    if (sampleMatch) {
      navigate({ to: `/app/samples/${sampleMatch[0]}` });
      toast.info(`Redirected to sample details for ${sampleMatch[0]}`);
      return;
    }
    
    // Extract Report ID (e.g. RPT-2030) or navigate to reports
    const reportMatch = title.match(/RPT-\d+/);
    if (reportMatch || title.toLowerCase().includes("report")) {
      navigate({ to: "/app/reports" });
      toast.info("Redirected to Reports & Certifications dashboard");
      return;
    }

    // Default fallback
    navigate({ to: "/app" });
  };

  const roleInsights = {
    Customer: {
      title: "Customer Notifications",
      detail: "Email + in-app updates for sample milestones and report release.",
      icon: <Mail className="size-4 text-primary" />,
    },
    "Lab Coordinator": {
      title: "Workflow Alerts",
      detail: "Realtime queue/assignment alerts across intake, prep, and analysis.",
      icon: <Workflow className="size-4 text-primary" />,
    },
    Admin: {
      title: "Approval & Security Stream",
      detail: "Approval requests, escalations, and security-sensitive events.",
      icon: <ShieldAlert className="size-4 text-primary" />,
    },
  }[role];

  const handleChannelToggle = (channel: string, active: boolean) => {
    const currentChannels = settings?.channels || ["In-app", "Email"];
    let updated;
    if (active) {
      updated = [...currentChannels, channel];
    } else {
      updated = currentChannels.filter((c: string) => c !== channel);
    }
    updateSettings({ channels: updated });
    toast.success(`Notification channel "${channel}" updated!`);
  };

  const handleTriggerToggle = (trigger: string, active: boolean) => {
    const currentTriggers = settings?.triggers || [
      "Report awaiting approval",
      "QA anomaly raised",
      "Sample overdue",
      "Instrument calibration due",
      "New customer signup"
    ];
    let updated;
    if (active) {
      updated = [...currentTriggers, trigger];
    } else {
      updated = currentTriggers.filter((t: string) => t !== trigger);
    }
    updateSettings({ triggers: updated });
    toast.success(`Alert trigger for "${trigger}" updated!`);
  };

  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{label:"Administration"},{label:"Notifications"}]} title="Notification Center" description="System alerts, approvals, and reminders." />
      <div className="rounded-xl border border-primary/20 bg-card/90 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{roleInsights.title}</p>
            <h3 className="mt-1 text-base font-semibold text-foreground inline-flex items-center gap-2">
              {roleInsights.icon}
              {roleInsights.detail}
            </h3>
          </div>
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Unread</p>
            <p className="text-xl font-bold text-primary">{unreadNotificationCount}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notification history</h3>
            <button
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer font-semibold"
              onClick={() => {
                markAllNotificationsRead();
                toast.success("All notifications marked as read");
              }}
            >
              <CheckCheck className="size-3.5" />
              Mark all as read
            </button>
          </div>
          <ul>
            {notificationsLoading ? (
              <li className="p-6 text-center text-sm text-muted-foreground font-semibold">Loading notifications...</li>
            ) : notifications.length === 0 ? (
              <li className="p-6 text-center text-sm text-muted-foreground font-semibold">No notifications</li>
            ) : (
              notifications.map((n, i) => (
                <li key={n.id ?? i} className="border-t border-border first:border-0 p-4 flex gap-3 hover:bg-muted/30 items-center">
                  <span className={`size-2.5 shrink-0 rounded-full ${n.kind === "alert" ? "bg-destructive animate-pulse" : n.kind === "approval" ? "bg-warning" : "bg-info"}`} />
                  <div className="flex-1">
                    <p className={`text-sm ${n.isRead ? "text-muted-foreground font-medium" : "font-semibold text-foreground"}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {n.time} · <span className="capitalize">{n.kind}</span> · {(n.channel || "in-app").replace("-", " ")}
                    </p>
                    {n.body && <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!n.isRead && (
                      <button
                        onClick={() => {
                          void markNotificationRead(n.id);
                        }}
                        className="text-xs text-muted-foreground font-semibold hover:text-foreground"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => handleNotificationClick(n.title)}
                      className="text-xs text-primary font-bold hover:underline cursor-pointer px-2 py-1 rounded hover:bg-primary/10 transition"
                    >
                      View
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Channels</h3>
            {([
              { Icon: Bell, label: "In-app" },
              { Icon: Mail, label: "Email" },
              { Icon: MessageSquare, label: "Workflow Alerts" },
            ]).map(({ Icon, label, disabled }, i) => {
              const channels = settings?.channels || ["In-app", "Email", "Workflow Alerts"];
              const checked = channels.includes(label);
              return (
                <label key={i} className={`mt-3 flex items-center justify-between text-sm select-none ${disabled ? "opacity-50" : "cursor-pointer hover:text-foreground"}`}>
                  <span className="inline-flex items-center gap-2 text-muted-foreground font-medium"><Icon className="size-4"/> {label}</span>
                  <input 
                    type="checkbox" 
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => handleChannelToggle(label, e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                </label>
              );
            })}
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Triggers</h3>
            <ul className="mt-3 space-y-2 text-xs">
              {[
                "Sample Received",
                "Sample Verified",
                "Sample Rejected",
                "Preparation Started",
                "Analysis Started",
                "QA/QC Failed",
                "Report Ready",
                "Account Approved",
              ].map((t) => {
                const triggers = settings?.triggers || [
                  "Sample Received",
                  "Sample Verified",
                  "Sample Rejected",
                  "Preparation Started",
                  "Analysis Started",
                  "QA/QC Failed",
                  "Report Ready",
                  "Account Approved",
                ];
                const checked = triggers.includes(t);
                return (
                  <li key={t} className="flex items-center justify-between rounded border border-border px-2 py-1.5 font-medium">
                    <span>{t}</span>
                    <input 
                      type="checkbox" 
                      checked={checked}
                      onChange={(e) => handleTriggerToggle(t, e.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary cursor-pointer"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
