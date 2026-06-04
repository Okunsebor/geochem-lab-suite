import { useState } from "react";
import { AnalyticalReport, Sample, SampleStatus } from "../types";
import { supabase, supabaseHelpers } from "../lib/supabase";

export function useReportsCore(
  currentName: string,
  addActivity: (who: string, what: string, target: string) => void,
  addNotification: (title: string, kind: string) => void,
  samples: Sample[],
  updateSampleStatusLocally: (sampleId: string, status: SampleStatus) => void,
  syncSamplesFromDb: () => void,
) {
  const [reports, setReports] = useState<AnalyticalReport[]>([]);

  const saveReports = (data: AnalyticalReport[]) => {
    setReports(data);
    localStorage.setItem("gcs_reports", JSON.stringify(data));
  };

  const syncReportsFromDb = async () => {
    try {
      const { data: reportsData, error: reportsErr } = await supabase
        .from("reports" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (reportsErr) throw reportsErr;

      const { data: logsData, error: logsErr } = await supabase
        .from("report_logs" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (logsErr) throw logsErr;

      if (reportsData && reportsData.length > 0) {
        const mappedReports: AnalyticalReport[] = reportsData.map((r: any) => {
          const reportLogs = (logsData || [])
            .filter((l: any) => l.report_id === r.id)
            .map((l: any) => ({
              id: l.id,
              reportId: l.report_id,
              status: l.status,
              action: l.action,
              performedBy: l.performed_by,
              comments: l.comments,
              createdAt: l.created_at,
            }));

          return {
            id: r.id,
            sample: r.sample_id,
            client: r.client,
            status: r.status,
            createdAt: r.created_at || r.createdAt || new Date().toISOString(),
            pages: r.pages,
            pdfUrl: r.pdf_url,
            comments: r.comments,
            approvedBy: r.approved_by,
            approvedAt: r.approved_at,
            deliveredBy: r.delivered_by,
            deliveredAt: r.delivered_at,
            history: reportLogs,
          };
        });

        setReports(mappedReports);
        localStorage.setItem("gcs_reports", JSON.stringify(mappedReports));
        return;
      }
    } catch (err: any) {
      console.warn(
        "Reports: Supabase unavailable or table missing, using local sandbox mode:",
        err.message,
      );
      const local = localStorage.getItem("gcs_reports");
      if (local) {
        setReports(JSON.parse(local));
      }
    }
  };

  const generateReport = async (sampleId: string) => {
    const sample = samples.find((s) => s.id === sampleId);
    if (!sample) return;

    setReports((prevReports) => {
      const reportId = `RPT-${2030 + prevReports.length}`;

      const newReport: AnalyticalReport = {
        id: reportId,
        sample: sampleId,
        client: sample.client,
        status: "Pending Approval",
        createdAt: new Date().toISOString(),
        pages: 1,
        history: [],
      };

      const doGenerate = async () => {
        let pdfUrl = "";
        try {
          const { generateReportPdfBlob } = await import("../lib/report-service");
          const pdfBlob = await generateReportPdfBlob(newReport, sample, sample.results || []);

          try {
            pdfUrl = await supabaseHelpers.uploadReportPdf(
              reportId,
              new File([pdfBlob], `${reportId}.pdf`, { type: "application/pdf" }),
            );
            newReport.pdfUrl = pdfUrl;
          } catch (uploadErr) {
            console.warn("Storage upload failed, fallback to local URL:", uploadErr);
            pdfUrl = URL.createObjectURL(pdfBlob);
            newReport.pdfUrl = pdfUrl;
          }
        } catch (pdfErr) {
          console.warn("PDF generation failed:", pdfErr);
        }

        try {
          await supabase.from("reports" as any).insert({
            id: reportId,
            sample_id: sampleId,
            client: sample.client,
            client_org_id: sample.client === "Barrick Gold" ? "org-barrick" : "org-auric",
            status: "Pending Approval",
            pages: 1,
            pdf_url: pdfUrl || null,
          });

          await supabase.from("report_logs" as any).insert({
            report_id: reportId,
            status: "Pending Approval",
            action: "Generated",
            performed_by: currentName,
            comments: "Report compiled and draft generated awaiting approval.",
          });

          syncReportsFromDb();
        } catch (err) {
          console.warn("Offline report creation fallback:", err);
          // If offline, we update the state directly
          setReports((current) => {
            const withUrl = current.map((r) => (r.id === reportId ? { ...r, pdfUrl } : r));
            localStorage.setItem("gcs_reports", JSON.stringify(withUrl));
            return withUrl;
          });
        }
      };

      doGenerate();

      const updated = [newReport, ...prevReports];
      localStorage.setItem("gcs_reports", JSON.stringify(updated));

      addActivity(currentName, "compiled report draft", reportId);
      addNotification(`Report ${reportId} awaiting approval for GCS-${sampleId}`, "approval");

      return updated;
    });
  };

  const approveReport = async (reportId: string, comments?: string) => {
    let reportSampleId: string | undefined;

    setReports((prev) => {
      const now = new Date().toISOString();
      const report = prev.find((r) => r.id === reportId);
      if (report) {
        reportSampleId = report.sample;
      }
      const updated = prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            status: "Approved" as const,
            approvedBy: currentName,
            approvedAt: now,
            comments: comments || undefined,
          };
        }
        return r;
      });
      localStorage.setItem("gcs_reports", JSON.stringify(updated));
      return updated;
    });

    if (reportSampleId) {
      updateSampleStatusLocally(reportSampleId, "Report Ready");
    }

    try {
      const now = new Date().toISOString();
      await supabase
        .from("reports" as any)
        .update({
          status: "Approved",
          approved_by: currentName,
          approved_at: now,
          comments: comments || null,
        })
        .eq("id", reportId);

      await supabase.from("report_logs" as any).insert({
        report_id: reportId,
        status: "Approved",
        action: "Approved",
        performed_by: currentName,
        comments: comments || "Report verified, signed, and certified.",
      });

      if (reportSampleId) {
        await supabase
          .from("samples")
          .update({
            status: "Report Ready",
          })
          .eq("id", reportSampleId);
      }

      syncReportsFromDb();
      syncSamplesFromDb();
    } catch (err) {
      console.warn("DB update failed for report approval:", err);
    }

    addActivity(currentName, "approved report", reportId);
    addNotification(`Report ${reportId} has been approved and signed`, "info");
  };

  const rejectReport = async (reportId: string, comments?: string) => {
    setReports((prev) => {
      const updated = prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            status: "Revised" as const,
            comments: comments || undefined,
          };
        }
        return r;
      });
      localStorage.setItem("gcs_reports", JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase
        .from("reports" as any)
        .update({
          status: "Revised",
          comments: comments || null,
        })
        .eq("id", reportId);

      await supabase.from("report_logs" as any).insert({
        report_id: reportId,
        status: "Revised",
        action: "Rejected",
        performed_by: currentName,
        comments: comments || "Report rejected back to draft.",
      });

      syncReportsFromDb();
    } catch (err) {
      console.warn("DB update failed for report rejection:", err);
    }

    addActivity(currentName, "rejected report", reportId);
  };

  const deliverReport = async (reportId: string, recipientEmail: string) => {
    setReports((prev) => {
      const now = new Date().toISOString();
      const updated = prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            status: "Delivered" as const,
            deliveredBy: currentName,
            deliveredAt: now,
          };
        }
        return r;
      });
      localStorage.setItem("gcs_reports", JSON.stringify(updated));
      return updated;
    });

    try {
      const now = new Date().toISOString();
      await supabase
        .from("reports" as any)
        .update({
          status: "Delivered",
          delivered_by: currentName,
          delivered_at: now,
        })
        .eq("id", reportId);

      await supabase.from("report_logs" as any).insert({
        report_id: reportId,
        status: "Delivered",
        action: "Delivered",
        performed_by: currentName,
        comments: `Report delivered via Portal/Email to ${recipientEmail}`,
      });

      syncReportsFromDb();
    } catch (err) {
      console.warn("DB update failed for report delivery:", err);
    }

    addActivity(currentName, "delivered report", reportId);
  };

  const downloadReportPdf = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) throw new Error("Report not found in LIMS registry.");

    const sample = samples.find((s) => s.id === report.sample);
    if (!sample)
      throw new Error(`Associated sample "${report.sample}" not found in LIMS registry.`);

    try {
      const { generateReportPdfBlob, downloadBlob } = await import("../lib/report-service");
      const pdfBlob = await generateReportPdfBlob(report, sample, sample.results || []);
      downloadBlob(pdfBlob, `${reportId}.pdf`);
    } catch (err) {
      console.error("Failed to generate and download PDF:", err);
      throw err;
    }
  };

  return {
    reports,
    setReports,
    saveReports,
    syncReportsFromDb,
    generateReport,
    approveReport,
    rejectReport,
    deliverReport,
    downloadReportPdf,
  };
}
