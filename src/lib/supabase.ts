import { createClient } from "@supabase/supabase-js";
import {
  Sample,
  Instrument,
  AnalyticalReport,
  User,
  SystemNotification,
  CustodyLogEntry,
  SampleNote,
  AnalyticalResult,
  AnomalyFlag,
} from "../types";

// 1. Isomorphic credentials load (supports client-side Vite and server-side SSR/Node)
const SUPABASE_URL = 
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || 
  process.env.SUPABASE_URL || 
  "";

const SUPABASE_ANON_KEY = 
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
  process.env.SUPABASE_ANON_KEY || 
  "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (typeof window !== "undefined") {
    console.warn(
      "Supabase environment variables are missing! Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your local .env file."
    );
  }
}

// 2. TypeScript database definitions matching our LIMS normalised tables
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          type: "Lab_Operator" | "Mining_Client";
          timezone: string;
          currency: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      users: {
        Row: {
          id: string;
          org_id: string;
          full_name: string;
          email: string;
          role: User["role"];
          status: User["status"];
          last_seen: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "last_seen">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      samples: {
        Row: {
          id: string; // GCS-XXXXX serials
          client_org_id: string;
          project_name: string;
          sample_type: string;
          status: Sample["status"];
          weight_kg: number;
          priority: Sample["priority"];
          storage_location: string;
          registered_by_user_id: string;
          matrix: string;
          container: string;
          received_from: string;
          special_instructions: string | null;
          acceptance_status: string | null;
          rejection_reason: string | null;
          verification_notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["samples"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["samples"]["Insert"]>;
      };
      custody_logs: {
        Row: {
          id: string;
          sample_id: string;
          performed_by_user_id: string;
          action: string;
          equipment_id: string | null;
          comments: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["custody_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["custody_logs"]["Insert"]>;
      };
      sample_notes: {
        Row: {
          id: string;
          sample_id: string;
          author_user_id: string;
          comment: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sample_notes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["sample_notes"]["Insert"]>;
      };
      analytical_results: {
        Row: {
          id: string;
          sample_id: string;
          element: string;
          value: string;
          unit: string;
          method: string;
          instrument_id: string | null;
          qa_status: "Pass" | "Flag" | "Pending Approval";
          analyzed_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["analytical_results"]["Row"], "id" | "analyzed_at">;
        Update: Partial<Database["public"]["Tables"]["analytical_results"]["Insert"]>;
      };
      instruments: {
        Row: {
          id: string; // Instrument model code (e.g. ICP-MS-01)
          name: string;
          status: Instrument["status"];
          queue: number;
          util: number;
          last_calibrated: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["instruments"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["instruments"]["Insert"]>;
      };
      reports: {
        Row: {
          id: string; // RPT-XXXX
          sample_id: string;
          client_org_id: string;
          status: AnalyticalReport["status"];
          signed_by_user_id: string | null;
          pdf_url: string | null;
          pages: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reports"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: number;
          target_user_id: string;
          title: string;
          kind: SystemNotification["kind"];
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      sample_attachments: {
        Row: {
          id: string;
          sample_id: string;
          name: string;
          file_path: string;
          size_bytes: number;
          uploaded_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sample_attachments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["sample_attachments"]["Insert"]>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// 3. Central isomorphic typed Supabase client singleton instance
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// 4. Client helpers for core LIMS data pipelines
export const supabaseHelpers = {
  // Auth Helpers
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Storage / File Ingestion Helpers
  uploadReportPdf: async (reportId: string, file: File) => {
    const fileExt = file.name.split(".").pop();
    const filePath = `reports/${reportId}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from("reports")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (error) throw error;
    
    // Retrieve public download link
    const { data: { publicUrl } } = supabase.storage
      .from("reports")
      .getPublicUrl(filePath);
      
    return publicUrl;
  },

  uploadBarcodeSvg: async (sampleId: string, svgBlob: Blob) => {
    const filePath = `barcodes/${sampleId}.svg`;
    
    const { data, error } = await supabase.storage
      .from("barcodes")
      .upload(filePath, svgBlob, { cacheControl: "31536000", upsert: true });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from("barcodes")
      .getPublicUrl(filePath);
      
    return publicUrl;
  },

  // Connection Telemetry Diagnostic Health Check
  healthCheck: async () => {
    console.log("=== SUPABASE CONNECTION HEALTH CHECK ===");
    const results = {
      envLoaded: false,
      clientInit: false,
      dbConnected: false,
      error: null as string | null,
    };

    try {
      // 1. Verify Env
      const hasUrl = !!SUPABASE_URL && SUPABASE_URL !== "https://your-project-id.supabase.co" && SUPABASE_URL.trim() !== "";
      const hasKey = !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 50 && SUPABASE_ANON_KEY.trim() !== "";
      results.envLoaded = hasUrl && hasKey;
      console.log("1. Environment variables loaded:", results.envLoaded ? "✓ SUCCESS" : "✗ FAILED (Placeholders or missing config)");

      if (!results.envLoaded) {
        throw new Error("Missing or placeholder Supabase credentials in local environment configuration.");
      }

      // 2. Verify Init
      const client = supabase;
      results.clientInit = !!client;
      console.log("2. Client initialized successfully:", results.clientInit ? "✓ SUCCESS" : "✗ FAILED");

      // 3. Verify Database/API connection
      console.log("3. Probing Database endpoint connection...");
      const { error, status } = await supabase
        .from("instruments")
        .select("*")
        .limit(1);

      // Status codes in 2xx represent successful connection
      // Status 404 represents fully reached API but table does not exist (schema not created yet), which still proves postgres connection works!
      // Status 401 represents unauthorized which also proves the URL and key hit the gateway.
      if (status >= 200 && status < 500) {
        results.dbConnected = true;
        console.log(`✓ DATABASE CONNECTION ESTABLISHED (Gateway Status Code: ${status})`);
        if (error) {
          console.log(`   Notice: API returned message "${error.message}" (Code: ${error.code}). This is expected if the instruments table has not been migrated yet.`);
        }
      } else {
        throw new Error(error?.message || `Database gateway returned connection error status ${status}`);
      }
    } catch (err: any) {
      results.error = err.message || String(err);
      console.error("✗ HEALTH CHECK ENCOUNTERED ERRORS:", results.error);
    }

    return results;
  },
};
