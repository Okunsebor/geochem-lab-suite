import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLimsState } from "@/hooks/use-lims-state";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, CheckCircle2, MailCheck, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";

interface EmailDeliveryRow {
  id: string;
  notificationId?: number;
  recipientEmail: string;
  subject: string;
  body: string;
  status: "queued" | "sent" | "failed" | string;
  attempts: number;
  sentAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export default function NotificationDeliveryConsoleFeature() {
  const { currentUser } = useLimsState();
  const [rows, setRows] = useState<EmailDeliveryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const sync = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notification_emails" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const mapped: EmailDeliveryRow[] = (data || []).map((r: any) => ({
        id: r.id,
        notificationId: r.notification_id || undefined,
        recipientEmail: r.recipient_email,
        subject: r.subject,
        body: r.body,
        status: r.status,
        attempts: Number(r.attempts || 0),
        sentAt: r.sent_at || null,
        errorMessage: r.error_message || null,
        createdAt: r.created_at,
      }));
      setRows(mapped);
    } catch {
      setRows([]);
      toast.error("Unable to load notification delivery queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sync();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-notification-delivery-console")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_emails" },
        () => {
          sync();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const queued = rows.filter((r) => r.status === "queued").length;
    const sent = rows.filter((r) => r.status === "sent").length;
    const failed = rows.filter((r) => r.status === "failed").length;
    return { queued, sent, failed };
  }, [rows]);

  const retryFailed = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notification_emails" as any)
        .update({
          status: "queued",
          attempts: 0,
          error_message: null,
          sent_at: null,
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("Delivery queued for retry.");
      sync();
    } catch {
      toast.error("Retry failed.");
    }
  };

  if (currentUser?.role !== "Admin") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Access restricted to administrators.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Administration" }, { label: "Notification Delivery Console" }]}
        title="Notification Delivery Console"
        description="Monitor email delivery queue, failures, and retries in realtime."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">Queued Emails</p>
          <p className="mt-1 inline-flex items-center gap-2 text-2xl font-bold text-primary">
            <Send className="size-5" />
            {stats.queued}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">Delivered Emails</p>
          <p className="mt-1 inline-flex items-center gap-2 text-2xl font-bold text-emerald-500">
            <MailCheck className="size-5" />
            {stats.sent}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">Failed Emails</p>
          <p className="mt-1 inline-flex items-center gap-2 text-2xl font-bold text-destructive">
            <AlertTriangle className="size-5" />
            {stats.failed}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Delivery History</h3>
          <button onClick={sync} className="text-xs text-primary font-semibold hover:underline">
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-left [&>th]:font-semibold border-b border-border">
                <th>Status</th>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Attempts</th>
                <th>Created</th>
                <th>Sent</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    Loading delivery queue...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    No delivery records yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-border [&>td]:px-4 [&>td]:py-2.5">
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                          row.status === "sent"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : row.status === "failed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                        }`}
                      >
                        {row.status === "sent" ? <CheckCircle2 className="size-3" /> : null}
                        {row.status}
                      </span>
                    </td>
                    <td className="font-medium">{row.recipientEmail}</td>
                    <td>
                      <p className="font-medium text-foreground">{row.subject}</p>
                      {row.errorMessage && (
                        <p className="text-xs text-destructive mt-0.5">{row.errorMessage}</p>
                      )}
                    </td>
                    <td>{row.attempts}</td>
                    <td className="text-xs text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {row.sentAt ? new Date(row.sentAt).toLocaleString() : "—"}
                    </td>
                    <td>
                      {row.status === "failed" ? (
                        <button
                          onClick={() => retryFailed(row.id)}
                          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                        >
                          <RotateCcw className="size-3" />
                          Retry
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
