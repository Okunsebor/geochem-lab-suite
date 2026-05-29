import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLimsState } from "@/hooks/use-lims-state";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsFeature() {
  const { notifications = [], markAllNotificationsRead, settings, updateSettings } = useLimsState();
  const navigate = useNavigate();

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
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">All notifications</h3>
            <button
              className="text-xs text-primary hover:underline cursor-pointer font-semibold"
              onClick={() => {
                markAllNotificationsRead();
                toast.success("All notifications marked as read");
              }}
            >
              Mark all as read
            </button>
          </div>
          <ul>
            {notifications.length === 0 ? (
              <li className="p-6 text-center text-sm text-muted-foreground font-semibold">No notifications</li>
            ) : (
              notifications.map((n, i) => (
                <li key={n.id ?? i} className="border-t border-border first:border-0 p-4 flex gap-3 hover:bg-muted/30 items-center">
                  <span className={`size-2.5 shrink-0 rounded-full ${n.kind === "alert" ? "bg-destructive animate-pulse" : n.kind === "approval" ? "bg-warning" : "bg-info"}`} />
                  <div className="flex-1">
                    <p className={`text-sm ${n.isRead ? "text-muted-foreground font-medium" : "font-semibold text-foreground"}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{n.time} ago · <span className="capitalize">{n.kind}</span></p>
                  </div>
                  <button 
                    onClick={() => handleNotificationClick(n.title)}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer px-2 py-1 rounded hover:bg-primary/10 transition"
                  >
                    View
                  </button>
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
              { Icon: MessageSquare, label: "SMS (coming soon)", disabled: true },
            ]).map(({ Icon, label, disabled }, i) => {
              const channels = settings?.channels || ["In-app", "Email"];
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
              {["Report awaiting approval","QA anomaly raised","Sample overdue","Instrument calibration due","New customer signup"].map((t) => {
                const triggers = settings?.triggers || [
                  "Report awaiting approval",
                  "QA anomaly raised",
                  "Sample overdue",
                  "Instrument calibration due",
                  "New customer signup"
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
