import React, { createContext, useContext, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth, type RegisterUserInput } from "./use-auth";
import {
  Sample,
  Instrument,
  AnalyticalReport,
  ActivityLog,
  SystemNotification,
  User,
  SampleStatus,
  Priority
} from "../types";

import { useActivityCore } from "./use-activity-core";
import { useNotificationsCore } from "./use-notifications-core";
import { useInstrumentsCore } from "./use-instruments-core";
import { useUsersCore } from "./use-users-core";
import { useSamplesCore } from "./use-samples-core";
import { useReportsCore } from "./use-reports-core";

interface LimsStateContextType {
  samples: Sample[];
  instruments: Instrument[];
  reports: AnalyticalReport[];
  activity: ActivityLog[];
  notifications: SystemNotification[];
  users: User[];
  currentUser: User | null;
  loading: boolean;
  tickets: any[];
  settings: any;
  
  // Actions
  login: (email: string, password: string) => Promise<any>;
  registerUser: (input: RegisterUserInput) => Promise<{ needsVerification: boolean; email: string }>;
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
  logBarcodeScan: (sampleId: string, location: string, actionDetails: string) => Promise<void>;
  fetchSampleDetails: (sampleId: string) => Promise<void>;
  addSupportTicket: (ticket: any) => void;
  updateSettings: (newSettings: any) => void;
}

const LimsStateContext = createContext<LimsStateContextType | undefined>(undefined);

export function LimsStateProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, login, registerUser, logout, switchUserRole } = useAuth();
  const currentName = currentUser?.name || "System";

  const { activity, addActivity, clearActivity } = useActivityCore();
  const { notifications, addNotification, markAllNotificationsRead, clearNotifications } = useNotificationsCore();

  const addActivityHelper = (who: string, what: string, target: string) => {
    addActivity({
      who,
      what,
      target,
      when: "Just now",
      ip: "10.0.1.50"
    });
  };

  const addNotificationHelper = (title: string, kind: string) => {
    addNotification({
      id: Date.now(),
      title,
      time: "Just now",
      kind: kind as any,
      isRead: false,
    });
  };

  const { instruments, toggleInstrumentStatus, fetchInstruments, saveInstruments } = useInstrumentsCore(currentName, addActivityHelper);
  const { users, tickets, settings, inviteUser, addSupportTicket, updateSettings, fetchUsers, saveUsers } = useUsersCore(currentName, addActivityHelper);

  const generateReportRef = useRef<(sampleId: string) => void>(() => {});

  const {
    samples,
    syncSamplesFromDb,
    registerSample,
    addSampleNote,
    updateSampleStatus,
    verifySample,
    rejectSample,
    assignStorageLocation,
    uploadSampleAttachment,
    logBarcodeScan,
    fetchSampleDetails,
  } = useSamplesCore(currentUser, currentName, addActivityHelper, addNotificationHelper, (id) => generateReportRef.current(id));

  const {
    reports,
    syncReportsFromDb,
    generateReport,
    approveReport,
    rejectReport,
    deliverReport,
    downloadReportPdf,
  } = useReportsCore(currentName, addActivityHelper, addNotificationHelper, samples, updateSampleStatus, syncSamplesFromDb);

  generateReportRef.current = generateReport;

  // Inject primary color variable dynamically to enforce branding selection globally
  useEffect(() => {
    if (settings?.primaryColor) {
      document.documentElement.style.setProperty("--primary", settings.primaryColor);
    }
  }, [settings?.primaryColor]);

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
  }, [syncSamplesFromDb, syncReportsFromDb]);

  // Load from local storage or initialize
  useEffect(() => {
    syncSamplesFromDb();
    syncReportsFromDb();
    
    (async () => {
      await fetchInstruments();
      
      const localAct = localStorage.getItem("gcs_activity");
      if (!localAct) clearActivity();
      
      const localNot = localStorage.getItem("gcs_notifications");
      if (!localNot) clearNotifications();
      
      await fetchUsers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        tickets,
        settings,
        login,
        registerUser,
        logout,
        registerSample,
        addSampleNote,
        updateSampleStatus,
        generateReport: generateReport as any,
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
        logBarcodeScan,
        fetchSampleDetails,
        addSupportTicket,
        updateSettings,
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
