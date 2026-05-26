import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, supabaseHelpers } from "../lib/supabase";
import { useAuth } from "./use-auth";
import {
  Sample,
  Instrument,
  AnalyticalReport,
  ReportLog,
  ActivityLog,
  SystemNotification,
  User,
  SampleStatus,
  Priority,
  SampleNote,
  CustodyLogEntry,
} from "../types";
// Removed mock-data imports; production data is fetched from Supabase.

interface LimsStateContextType {
  samples: Sample[];
  instruments: Instrument[];
  reports: AnalyticalReport[];
  activity: ActivityLog[];
  notifications: SystemNotification[];
  users: User[];
  currentUser: User | null;
  loading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<any>;
  registerUser: (email: string, password: string, name: string, role: User["role"]) => Promise<any>;
  logout: () => Promise<void>;
  registerSample: (sampleData: {
    client: string;
    project: string;
    type: string;
    weight: string;
    priority: Priority;
    location: string;
    matrix?: string;
    container?: string;
    receivedFrom?: string;
    specialInstructions?: string;
  }) => Sample;
  addSampleNote: (sampleId: string, comment: string) => void;
  updateSampleStatus: (sampleId: string, status: SampleStatus) => void;
  generateReport: (sampleId: string) => Promise<void>;
  approveReport: (reportId: string, comments?: string) => Promise<void>;
  rejectReport: (reportId: string, comments?: string) => Promise<void>;
  deliverReport: (reportId: string, recipientEmail: string) => Promise<void>;
  downloadReportPdf: (reportId: string) => Promise<void>;
  inviteUser: (name: string, email: string, role: User["role"]) => void;
  toggleInstrumentStatus: (instrumentId: string, status: Instrument["status"]) => void;
  markAllNotificationsRead: () => void;
  switchUserRole: (role: User["role"]) => void;
  verifySample: (sampleId: string, notes: string, storageLocation: string) => Promise<void>;
  rejectSample: (sampleId: string, reason: string) => Promise<void>;
  assignStorageLocation: (sampleId: string, location: string) => Promise<void>;
  uploadSampleAttachment: (sampleId: string, file: File) => Promise<any>;
}

// Helper to transform Supabase DB rows into LIMS UI-ready shapes
function mapDbSampleToUi(
  s: any,
  notes: any[] = [],
  results: any[] = [],
  custody: any[] = [],
  attachments: any[] = []
): Sample {
  return {
    id: s.id,
    client: s.client_name || s.client || (s.client_org_id === "org-barrick" ? "Barrick Gold" : "Auric Mining"),
    project: s.project_name || s.project || "Exploration A",
    type: s.sample_type || s.type || "Core Split",
    status: (s.status || "Received") as SampleStatus,
    receivedAt: s.created_at || s.receivedAt || new Date().toISOString(),
    technician: s.technician || "M. Rivera",
    priority: (s.priority || "Normal") as Priority,
    location: s.storage_location || s.location || "Rack B-12",
    weight: s.weight_kg ? `${s.weight_kg} kg` : (s.weight || "2.5 kg"),
    matrix: s.matrix || "Sulphide",
    container: s.container || "Calico Bag",
    receivedFrom: s.received_from || s.receivedFrom || "Field Courier",
    specialInstructions: s.special_instructions || s.specialInstructions || undefined,
    acceptanceStatus: s.acceptance_status || "Pending",
    rejectionReason: s.rejection_reason || undefined,
    verificationNotes: s.verification_notes || undefined,
    attachments: (attachments || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      filePath: a.file_path,
      sizeBytes: Number(a.size_bytes || 0),
      uploadedBy: a.uploaded_by || "System",
      createdAt: a.created_at
    })),
    notes: (notes || []).map((n: any) => ({
      id: n.id.toString(),
      author: n.author_name || n.author || "Staff",
      comment: n.comment || "",
      timestamp: n.created_at || n.timestamp || new Date().toISOString()
    })),
    results: (results || []).map((r: any) => ({
      element: r.element || "",
      value: r.value || "—",
      unit: r.unit || "g/t",
      method: r.method || "FA-AAS",
      qa: r.qa_status || r.qa || "Pass"
    })),
    custody: (custody || []).map((c: any) => ({
      action: c.action || "",
      technician: c.technician_name || c.technician || "Staff",
      time: c.time || (c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now")
    }))
  };
}

const LimsStateContext = createContext<LimsStateContextType | undefined>(undefined);

export function LimsStateProvider({ children }: { children: React.ReactNode }) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [reports, setReports] = useState<AnalyticalReport[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { currentUser, loading, login, registerUser, logout, switchUserRole } = useAuth();
  const currentName = currentUser?.name || "System";

  // Load samples from database or fallback to localStorage
  const syncSamplesFromDb = async () => {
    try {
      const { data, error } = await supabase
        .from("samples")
        .select(`
          *,
          sample_notes (*),
          custody_logs (*),
          analytical_results (*),
          sample_attachments (*)
        `);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const mapped = data.map((s: any) => {
          return mapDbSampleToUi(
            s,
            s.sample_notes || [],
            s.analytical_results || [],
            s.custody_logs || [],
            s.sample_attachments || []
          );
        });
        setSamples(mapped);
        localStorage.setItem("gcs_samples", JSON.stringify(mapped));
      } else {
        // Fallback to local storage if DB is empty but connected
        const local = localStorage.getItem("gcs_samples");
        if (local) {
          setSamples(JSON.parse(local));
        }
      }
    } catch (err: any) {
      console.warn("Could not load samples from real Supabase database, falling back to LIMS Sandbox:", err.message);
      const local = localStorage.getItem("gcs_samples");
      if (local) {
        setSamples(JSON.parse(local));
      } else {
        setSamples([]);
        localStorage.removeItem("gcs_samples");
      }
    }
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
              createdAt: l.created_at
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
            history: reportLogs
          };
        });

        setReports(mappedReports);
        localStorage.setItem("gcs_reports", JSON.stringify(mappedReports));
        return;
      }
    } catch (err: any) {
      console.warn("Reports: Supabase unavailable or table missing, using local sandbox mode:", err.message);
    }
  };

  // Synchronize dynamic realtime events
  useEffect(() => {
    const channel = supabase
      .channel("realtime-lims-samples")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "samples" },
        () => {
          syncSamplesFromDb();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" as any },
        () => {
          syncReportsFromDb();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "report_logs" as any },
        () => {
          syncReportsFromDb();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auth Operations are now delegated to central useAuth hook

  // Load from local storage or initialize
  useEffect(() => {
    syncSamplesFromDb();
    syncReportsFromDb();
    // Load initial data from Supabase or fallback to empty defaults
    (async () => {
      // Instruments
      const { data: instrumentsData, error: instrumentsErr } = await supabase.from("instruments").select("*");
      if (!instrumentsErr && instrumentsData) {
        const mapped = instrumentsData.map((i: any) => ({
          ...i,
          status: i.status as Instrument["status"],
          lastCalibrated: "14h ago",
        }));
        setInstruments(mapped);
        localStorage.setItem("gcs_instruments", JSON.stringify(mapped));
      } else {
        setInstruments([]);
        localStorage.setItem("gcs_instruments", JSON.stringify([]));
      }

      // Reports are handled by syncReportsFromDb

      // Activity – start empty
      setActivity([]);
      localStorage.setItem("gcs_activity", JSON.stringify([]));

      // Notifications – start empty
      setNotifications([]);
      localStorage.setItem("gcs_notifications", JSON.stringify([]));

      // Users
      const { data: usersData, error: usersErr } = await supabase.from("users").select("*");
      if (!usersErr && usersData) {
        setUsers(usersData);
        localStorage.setItem("gcs_users", JSON.stringify(usersData));
      } else {
        setUsers([]);
        localStorage.setItem("gcs_users", JSON.stringify([]));
      }
    })();
  }, []);

  // Save updates helper
  const saveSamples = (data: Sample[]) => {
    setSamples(data);
    localStorage.setItem("gcs_samples", JSON.stringify(data));
  };

  const saveInstruments = (data: Instrument[]) => {
    setInstruments(data);
    localStorage.setItem("gcs_instruments", JSON.stringify(data));
  };

  const saveReports = (data: AnalyticalReport[]) => {
    setReports(data);
    localStorage.setItem("gcs_reports", JSON.stringify(data));
  };

  const saveActivity = (data: ActivityLog[]) => {
    setActivity(data);
    localStorage.setItem("gcs_activity", JSON.stringify(data));
  };

  const saveNotifications = (data: SystemNotification[]) => {
    setNotifications(data);
    localStorage.setItem("gcs_notifications", JSON.stringify(data));
  };

  const saveUsers = (data: User[]) => {
    setUsers(data);
    localStorage.setItem("gcs_users", JSON.stringify(data));
  };

  // Actions implementation
  const registerSample = (sampleData: {
    client: string;
    project: string;
    type: string;
    weight: string;
    priority: Priority;
    location: string;
    matrix?: string;
    container?: string;
    receivedFrom?: string;
    specialInstructions?: string;
  }) => {
    const nextIdNum = 24000 + samples.length;
    const newSampleId = `GCS-${nextIdNum}`;
    const cleanWeight = sampleData.weight.endsWith(" kg") ? sampleData.weight : `${sampleData.weight} kg`;
    const numericWeight = parseFloat(sampleData.weight) || 2.5;

    // UI-shape representation
    const newSample: Sample = {
      id: newSampleId,
      client: sampleData.client,
      project: sampleData.project,
      type: sampleData.type,
      status: "Received",
      receivedAt: new Date().toISOString(),
      technician: currentName,
      priority: sampleData.priority,
      location: sampleData.location,
      weight: cleanWeight,
      matrix: sampleData.matrix || "Sulphide",
      container: sampleData.container || "Calico Bag",
      receivedFrom: sampleData.receivedFrom || "Field Courier",
      specialInstructions: sampleData.specialInstructions,
      notes: [],
      results: [
        { element: "Au", value: "—", unit: "g/t", method: "FA-AAS", qa: "Pending Approval" },
        { element: "Ag", value: "—", unit: "g/t", method: "ICP-MS", qa: "Pending Approval" },
      ],
      custody: [
        { action: "Received at intake", technician: currentName, time: "Just now" },
      ],
    };

    // 1. Perform background database write
    const writeToDb = async () => {
      try {
        const { error: sampleErr } = await supabase.from("samples").insert({
          id: newSampleId,
          client_org_id: sampleData.client === "Barrick Gold" ? "org-barrick" : "org-auric",
          project_name: sampleData.project,
          sample_type: sampleData.type,
          status: "Received",
          weight_kg: numericWeight,
          priority: sampleData.priority,
          storage_location: sampleData.location,
          registered_by_user_id: currentUser?.id?.toString() || "1",
          matrix: newSample.matrix,
          container: newSample.container,
          received_from: newSample.receivedFrom,
          special_instructions: sampleData.specialInstructions || null,
        });

        if (sampleErr) throw sampleErr;

        // Add initial Custody Entry
        await supabase.from("custody_logs").insert({
          sample_id: newSampleId,
          performed_by_user_id: currentUser?.id?.toString() || "1",
          action: "Received at intake",
          comments: "Intake registered in database",
        });

        // Insert initial results
        await supabase.from("analytical_results").insert([
          { sample_id: newSampleId, element: "Au", value: "—", unit: "g/t", method: "FA-AAS", qa_status: "Pending Approval" },
          { sample_id: newSampleId, element: "Ag", value: "—", unit: "g/t", method: "ICP-MS", qa_status: "Pending Approval" }
        ]);

        console.log(`Live DB write completed for sample ${newSampleId}`);
        syncSamplesFromDb();
      } catch (err: any) {
        console.warn("Could not insert sample in remote Supabase, running inside LIMS sandbox simulation:", err.message);
      }
    };

    writeToDb();

    // 2. Perform local update immediately (optimistic UI rendering)
    const updatedSamples = [newSample, ...samples];
    saveSamples(updatedSamples);

    // Add activity log
    const newActivity: ActivityLog = {
      who: currentName,
      what: "registered sample",
      target: newSampleId,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);

    // Add notification
    const newNotif: SystemNotification = {
      id: Date.now(),
      title: `Sample ${newSampleId} registered for ${newSample.client}`,
      time: "Just now",
      kind: "info",
      isRead: false,
    };
    saveNotifications([newNotif, ...notifications]);

    return newSample;
  };

  const addSampleNote = (sampleId: string, comment: string) => {
    const newNote: SampleNote = {
      id: Date.now().toString(),
      author: currentName,
      comment,
      timestamp: new Date().toISOString(),
    };

    const updated = samples.map((s) => {
      if (s.id === sampleId) {
        return {
          ...s,
          notes: [newNote, ...(s.notes || [])],
        };
      }
      return s;
    });

    saveSamples(updated);

    // 1. Perform background database write
    const writeNoteToDb = async () => {
      try {
        const { error: noteErr } = await supabase.from("sample_notes").insert({
          sample_id: sampleId,
          author_user_id: currentUser?.id?.toString() || "1",
          comment,
        });

        if (noteErr) throw noteErr;

        console.log(`Live DB write completed for sample note on ${sampleId}`);
        syncSamplesFromDb();
      } catch (err: any) {
        console.warn("Could not insert sample note in remote Supabase, running inside LIMS sandbox simulation:", err.message);
      }
    };

    writeNoteToDb();

    const newActivity: ActivityLog = {
      who: currentName,
      what: "added a note to",
      target: sampleId,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);
  };

  const updateSampleStatus = (sampleId: string, status: SampleStatus) => {
    const updated = samples.map((s) => {
      if (s.id === sampleId) {
        const newCustody: CustodyLogEntry = {
          action: `Status updated to ${status}`,
          technician: currentName,
          time: "Just now",
        };
        return {
          ...s,
          status,
          custody: [newCustody, ...(s.custody || [])],
        };
      }
      return s;
    });

    saveSamples(updated);

    // 1. Perform background database write
    const updateDb = async () => {
      try {
        const { error: sampleErr } = await supabase
          .from("samples")
          .update({ status })
          .eq("id", sampleId);

        if (sampleErr) throw sampleErr;

        // Insert new custody log
        await supabase.from("custody_logs").insert({
          sample_id: sampleId,
          performed_by_user_id: currentUser?.id?.toString() || "1",
          action: `Status updated to ${status}`,
          comments: `Moved through workflow step by ${currentName}`,
        });

        console.log(`Live DB update completed for sample ${sampleId}`);
        syncSamplesFromDb();
      } catch (err: any) {
        console.warn("Could not update sample status in remote Supabase, running inside LIMS sandbox simulation:", err.message);
      }
    };

    updateDb();

    // Check if report needs to be auto-drafted when Completed
    if (status === "Completed") {
      generateReport(sampleId);
    }

    const newActivity: ActivityLog = {
      who: currentName,
      what: `moved to ${status}`,
      target: sampleId,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);
  };

  const generateReport = async (sampleId: string) => {
    const sample = samples.find((s) => s.id === sampleId);
    if (!sample) return;

    const reportId = `RPT-${2030 + reports.length}`;
    
    // Create new report object
    const newReport: AnalyticalReport = {
      id: reportId,
      sample: sampleId,
      client: sample.client,
      status: "Pending Approval",
      createdAt: new Date().toISOString(),
      pages: 1,
      history: []
    };

    // Generate PDF Blob using report service
    let pdfUrl = "";
    try {
      const { generateReportPdfBlob } = await import("../lib/report-service");
      const pdfBlob = await generateReportPdfBlob(newReport, sample, sample.results || []);
      
      // Upload PDF to Supabase storage if connection is active
      try {
        pdfUrl = await supabaseHelpers.uploadReportPdf(reportId, new File([pdfBlob], `${reportId}.pdf`, { type: "application/pdf" }));
        newReport.pdfUrl = pdfUrl;
      } catch (uploadErr) {
        console.warn("Storage upload failed, fallback to local URL:", uploadErr);
        pdfUrl = URL.createObjectURL(pdfBlob);
        newReport.pdfUrl = pdfUrl;
      }
    } catch (pdfErr) {
      console.warn("PDF generation failed:", pdfErr);
    }

    const updatedReports = [newReport, ...reports];
    saveReports(updatedReports);

    // Save to database
    try {
      await supabase.from("reports" as any).insert({
        id: reportId,
        sample_id: sampleId,
        client: sample.client,
        client_org_id: sample.client === "Barrick Gold" ? "org-barrick" : "org-auric",
        status: "Pending Approval",
        pages: 1,
        pdf_url: pdfUrl || null
      });

      await supabase.from("report_logs" as any).insert({
        report_id: reportId,
        status: "Pending Approval",
        action: "Generated",
        performed_by: currentName,
        comments: "Report compiled and draft generated awaiting approval."
      });
      
      syncReportsFromDb();
    } catch (err) {
      console.warn("Offline report creation fallback:", err);
    }

    const notif: SystemNotification = {
      id: Date.now() + 1,
      title: `Report ${reportId} awaiting approval for GCS-${sampleId}`,
      time: "Just now",
      kind: "approval",
      isRead: false,
    };
    saveNotifications([notif, ...notifications]);

    const newActivity: ActivityLog = {
      who: currentName,
      what: "compiled report draft",
      target: reportId,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);
  };

  const approveReport = async (reportId: string, comments?: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const now = new Date().toISOString();
    const updatedReports = reports.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          status: "Approved" as const,
          approvedBy: currentName,
          approvedAt: now,
          comments: comments || undefined
        };
      }
      return r;
    });
    saveReports(updatedReports);

    // Update associated sample
    const sampleId = report.sample;
    const updatedSamples = samples.map((s) => {
      if (s.id === sampleId) {
        return {
          ...s,
          status: "Report Ready" as SampleStatus,
        };
      }
      return s;
    });
    saveSamples(updatedSamples);

    try {
      await supabase.from("reports" as any).update({
        status: "Approved",
        approved_by: currentName,
        approved_at: now,
        comments: comments || null
      }).eq("id", reportId);

      await supabase.from("report_logs" as any).insert({
        report_id: reportId,
        status: "Approved",
        action: "Approved",
        performed_by: currentName,
        comments: comments || "Report verified, signed, and certified."
      });

      await supabase.from("samples").update({
        status: "Report Ready"
      }).eq("id", sampleId);

      syncReportsFromDb();
      syncSamplesFromDb();
    } catch (err) {
      console.warn("DB update failed for report approval:", err);
    }

    const newActivity: ActivityLog = {
      who: currentName,
      what: "approved report",
      target: reportId,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);

    const newNotif: SystemNotification = {
      id: Date.now(),
      title: `Report ${reportId} has been approved and signed`,
      time: "Just now",
      kind: "info",
      isRead: false,
    };
    saveNotifications([newNotif, ...notifications]);
  };

  const rejectReport = async (reportId: string, comments?: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const updatedReports = reports.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          status: "Revised" as const,
          comments: comments || undefined
        };
      }
      return r;
    });
    saveReports(updatedReports);

    try {
      await supabase.from("reports" as any).update({
        status: "Revised",
        comments: comments || null
      }).eq("id", reportId);

      await supabase.from("report_logs" as any).insert({
        report_id: reportId,
        status: "Revised",
        action: "Rejected",
        performed_by: currentName,
        comments: comments || "Report rejected back to draft."
      });

      syncReportsFromDb();
    } catch (err) {
      console.warn("DB update failed for report rejection:", err);
    }

    const newActivity: ActivityLog = {
      who: currentName,
      what: "rejected report",
      target: reportId,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);
  };

  const deliverReport = async (reportId: string, recipientEmail: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const now = new Date().toISOString();
    const updatedReports = reports.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          status: "Delivered" as const,
          deliveredBy: currentName,
          deliveredAt: now
        };
      }
      return r;
    });
    saveReports(updatedReports);

    try {
      await supabase.from("reports" as any).update({
        status: "Delivered",
        delivered_by: currentName,
        delivered_at: now
      }).eq("id", reportId);

      await supabase.from("report_logs" as any).insert({
        report_id: reportId,
        status: "Delivered",
        action: "Delivered",
        performed_by: currentName,
        comments: `Report delivered via Portal/Email to ${recipientEmail}`
      });

      syncReportsFromDb();
    } catch (err) {
      console.warn("DB update failed for report delivery:", err);
    }

    const newActivity: ActivityLog = {
      who: currentName,
      what: "delivered report",
      target: reportId,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);
  };

  const downloadReportPdf = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const sample = samples.find(s => s.id === report.sample);
    if (!sample) return;

    try {
      const { generateReportPdfBlob, downloadBlob } = await import("../lib/report-service");
      const pdfBlob = await generateReportPdfBlob(report, sample, sample.results || []);
      downloadBlob(pdfBlob, `${reportId}.pdf`);
    } catch (err) {
      console.error("Failed to generate and download PDF:", err);
    }
  };

  const inviteUser = (name: string, email: string, role: User["role"]) => {
    const newUser: User = {
      id: users.length + 1,
      name,
      email,
      role,
      status: "Invited",
      lastSeen: "—",
    };
    saveUsers([...users, newUser]);

    const newActivity: ActivityLog = {
      who: currentName,
      what: "invited user",
      target: email,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);
  };

  const toggleInstrumentStatus = (instrumentId: string, status: Instrument["status"]) => {
    const updated = instruments.map((i) => {
      if (i.id === instrumentId) {
        return {
          ...i,
          status,
        };
      }
      return i;
    });
    saveInstruments(updated);

    const newActivity: ActivityLog = {
      who: currentName,
      what: `changed instrument ${instrumentId} status to ${status}`,
      target: instrumentId,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);
  };

  const markAllNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const verifySample = async (sampleId: string, notes: string, storageLocation: string) => {
    // 1. Local update
    const updated = samples.map((s) => {
      if (s.id === sampleId) {
        const newCustodyEntry: CustodyLogEntry = {
          action: "Verified & Accepted",
          technician: currentName,
          time: "Just now",
        };
        return {
          ...s,
          status: "Verified" as SampleStatus,
          acceptanceStatus: "Accepted" as const,
          verificationNotes: notes,
          location: storageLocation,
          custody: [newCustodyEntry, ...(s.custody || [])],
        };
      }
      return s;
    });
    saveSamples(updated);

    // 2. DB Update
    try {
      const { error: sampleErr } = await supabase
        .from("samples")
        .update({
          status: "Verified",
          acceptance_status: "Accepted",
          verification_notes: notes,
          storage_location: storageLocation,
        })
        .eq("id", sampleId);

      if (sampleErr) throw sampleErr;

      await supabase.from("custody_logs").insert({
        sample_id: sampleId,
        performed_by_user_id: currentUser?.id?.toString() || "1",
        action: "Verified & Accepted",
        comments: notes,
      });

      syncSamplesFromDb();
    } catch (err: any) {
      console.warn("verifySample DB write bypassed:", err.message);
    }

    // Add activity
    const newActivity: ActivityLog = {
      who: currentName,
      what: "verified sample",
      target: sampleId,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);
  };

  const rejectSample = async (sampleId: string, reason: string) => {
    // 1. Local update
    const updated = samples.map((s) => {
      if (s.id === sampleId) {
        const newCustodyEntry: CustodyLogEntry = {
          action: "Sample Rejected",
          technician: currentName,
          time: "Just now",
        };
        return {
          ...s,
          acceptanceStatus: "Rejected" as const,
          rejectionReason: reason,
          custody: [newCustodyEntry, ...(s.custody || [])],
        };
      }
      return s;
    });
    saveSamples(updated);

    // 2. DB Update
    try {
      const { error: sampleErr } = await supabase
        .from("samples")
        .update({
          acceptance_status: "Rejected",
          rejection_reason: reason,
        })
        .eq("id", sampleId);

      if (sampleErr) throw sampleErr;

      await supabase.from("custody_logs").insert({
        sample_id: sampleId,
        performed_by_user_id: currentUser?.id?.toString() || "1",
        action: "Sample Rejected",
        comments: reason,
      });

      syncSamplesFromDb();
    } catch (err: any) {
      console.warn("rejectSample DB write bypassed:", err.message);
    }

    const newActivity: ActivityLog = {
      who: currentName,
      what: "rejected sample",
      target: sampleId,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);
  };

  const assignStorageLocation = async (sampleId: string, location: string) => {
    // 1. Local update
    const updated = samples.map((s) => {
      if (s.id === sampleId) {
        const newCustodyEntry: CustodyLogEntry = {
          action: `Storage assigned: ${location}`,
          technician: currentName,
          time: "Just now",
        };
        return {
          ...s,
          location,
          custody: [newCustodyEntry, ...(s.custody || [])],
        };
      }
      return s;
    });
    saveSamples(updated);

    // 2. DB Update
    try {
      const { error: sampleErr } = await supabase
        .from("samples")
        .update({
          storage_location: location,
        })
        .eq("id", sampleId);

      if (sampleErr) throw sampleErr;

      await supabase.from("custody_logs").insert({
        sample_id: sampleId,
        performed_by_user_id: currentUser?.id?.toString() || "1",
        action: "Storage Location Assigned",
        comments: `Moved to rack/shelf ${location}`,
      });

      syncSamplesFromDb();
    } catch (err: any) {
      console.warn("assignStorageLocation DB write bypassed:", err.message);
    }

    const newActivity: ActivityLog = {
      who: currentName,
      what: "assigned storage to",
      target: sampleId,
      when: "Just now",
      ip: "10.0.1.50",
    };
    saveActivity([newActivity, ...activity]);
  };

  const uploadSampleAttachment = async (sampleId: string, file: File) => {
    const filePath = `attachments/${sampleId}/${Date.now()}_${file.name}`;
    
    try {
      // 1. Upload file to Supabase Storage Bucket
      const { error: uploadErr } = await supabase.storage
        .from("sample-documents" as any)
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadErr) throw uploadErr;

      // 2. Retrieve public URL
      const { data: { publicUrl } } = supabase.storage
        .from("sample-documents" as any)
        .getPublicUrl(filePath);

      // 3. Insert record in DB sample_attachments
      const { data: attachmentData, error: dbErr } = await supabase
        .from("sample_attachments" as any)
        .insert({
          sample_id: sampleId,
          name: file.name,
          file_path: publicUrl,
          size_bytes: file.size,
          uploaded_by: currentUser?.id?.toString() || null,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      // Sync from DB to refresh state
      syncSamplesFromDb();
      return attachmentData;
    } catch (err: any) {
      console.warn("uploadSampleAttachment DB write bypassed, creating local mock:", err.message);
      
      // Sandbox fallback local mock
      const mockAttachment = {
        id: Date.now().toString(),
        name: file.name,
        filePath: "#",
        sizeBytes: file.size,
        uploadedBy: currentName,
        createdAt: new Date().toISOString()
      };

      const updated = samples.map((s) => {
        if (s.id === sampleId) {
          return {
            ...s,
            attachments: [mockAttachment, ...(s.attachments || [])]
          };
        }
        return s;
      });
      saveSamples(updated);

      return mockAttachment;
    }
  };

  return (
    <LimsStateContext.Provider
      value={{
        samples,
        instruments,
        reports,
        activity,
        notifications,
        users,
        currentUser,
        loading,
        login,
        registerUser,
        logout,
        registerSample,
        addSampleNote,
        updateSampleStatus,
        generateReport,
        approveReport,
        rejectReport,
        deliverReport,
        downloadReportPdf,
        inviteUser,
        toggleInstrumentStatus,
        markAllNotificationsRead,
        switchUserRole,
        verifySample,
        rejectSample,
        assignStorageLocation,
        uploadSampleAttachment,
      }}
    >
      {children}
    </LimsStateContext.Provider>
  );
}

export function useLimsState() {
  const context = useContext(LimsStateContext);
  if (!context) {
    throw new Error("useLimsState must be used within LimsStateProvider");
  }
  return context;
}
