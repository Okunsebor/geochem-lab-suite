import { useState } from "react";
import { Sample, SampleStatus, Priority, CustodyLogEntry, SampleNote } from "../types";
import { supabase, supabaseHelpers } from "../lib/supabase";
import { toast } from "sonner";
import { User } from "../types";

export function mapDbSampleToUi(
  s: any,
  notes: any[] = [],
  results: any[] = [],
  custody: any[] = [],
  attachments: any[] = [],
): Sample {
  return {
    id: s.id,
    client:
      s.client_name ||
      s.client ||
      (s.client_org_id === "org-barrick" ? "Barrick Gold" : "Auric Mining"),
    project: s.project_name || s.project || "Exploration A",
    type: s.sample_type || s.type || "Core Split",
    status: (s.status || "Received") as SampleStatus,
    receivedAt: s.created_at || s.receivedAt || new Date().toISOString(),
    technician: s.technician || "M. Rivera",
    priority: (s.priority || "Normal") as Priority,
    location: s.storage_location || s.location || "Rack B-12",
    weight: s.weight_kg ? `${s.weight_kg} kg` : s.weight || "2.5 kg",
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
      createdAt: a.created_at,
    })),
    notes: (notes || []).map((n: any) => ({
      id: n.id.toString(),
      author: n.author_name || n.author || "Staff",
      comment: n.comment || "",
      timestamp: n.created_at || n.timestamp || new Date().toISOString(),
    })),
    results: (results || []).map((r: any) => ({
      element: r.element || "",
      value: r.value || "—",
      unit: r.unit || "g/t",
      method: r.method || "FA-AAS",
      qa: r.qa_status || r.qa || "Pass",
    })),
    custody: (custody || []).map((c: any) => ({
      action: c.action || "",
      technician: c.technician_name || c.technician || "Staff",
      time:
        c.time ||
        (c.created_at
          ? new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Just now"),
    })),
  };
}

export function useSamplesCore(
  currentUser: User | null,
  currentName: string,
  addActivity: (who: string, what: string, target: string) => void,
  addNotification: (title: string, kind: string) => void,
  generateReportCallback: (sampleId: string) => void,
) {
  const [samples, setSamples] = useState<Sample[]>([]);

  const saveSamples = (data: Sample[]) => {
    setSamples(data);
    localStorage.setItem("gcs_samples", JSON.stringify(data));
  };

  const syncSamplesFromDb = async () => {
    try {
      const { data, error } = await supabase.from("samples").select(`
          id,
          client_name,
          project_name,
          sample_type,
          status,
          priority,
          storage_location,
          weight_kg,
          created_at,
          technician,
          matrix,
          container,
          received_from,
          special_instructions,
          acceptance_status,
          rejection_reason,
          verification_notes,
          sample_notes (*),
          analytical_results (*),
          custody_logs (*),
          sample_attachments (*)
        `);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setSamples((prev) => {
          const mapped = data.map((s: any) => {
            const existing = prev.find((x) => x.id === s.id);
            return mapDbSampleToUi(
              s,
              s.sample_notes || existing?.notes || [],
              s.analytical_results || existing?.results || [],
              s.custody_logs || existing?.custody || [],
              s.sample_attachments || existing?.attachments || [],
            );
          });
          localStorage.setItem("gcs_samples", JSON.stringify(mapped));
          return mapped;
        });
      } else {
        const local = localStorage.getItem("gcs_samples");
        if (local) {
          setSamples(JSON.parse(local));
        }
      }
    } catch (err: any) {
      console.warn(
        "Could not load samples from real Supabase database, falling back to LIMS Sandbox:",
        err.message,
      );
      const local = localStorage.getItem("gcs_samples");
      if (local) {
        setSamples(JSON.parse(local));
      } else {
        setSamples([]);
        localStorage.removeItem("gcs_samples");
      }
    }
  };

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
    setSamples((currentSamples) => {
      const nextIdNum = 24000 + currentSamples.length;
      const newSampleId = `GCS-${nextIdNum}`;
      const cleanWeight = sampleData.weight.endsWith(" kg")
        ? sampleData.weight
        : `${sampleData.weight} kg`;
      const numericWeight = parseFloat(sampleData.weight) || 2.5;

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
        results: [],
        custody: [{ action: "Received at intake", technician: currentName, time: "Just now" }],
      };

      const writeToDb = async () => {
        try {
          const { error: sampleErr } = await supabase.from("samples").insert({
            id: newSampleId,
            client_org_id: sampleData.client === "Barrick Gold" ? "org-barrick" : "org-auric",
            client_name: sampleData.client,
            project_name: sampleData.project,
            sample_type: sampleData.type,
            status: "Received",
            weight_kg: numericWeight,
            priority: sampleData.priority,
            storage_location: sampleData.location,
            registered_by_user_id: currentUser?.id?.toString() || "1",
            technician: currentName,
            matrix: newSample.matrix,
            container: newSample.container,
            received_from: newSample.receivedFrom,
            special_instructions: sampleData.specialInstructions || null,
          });

          if (sampleErr) throw sampleErr;

          await supabase.from("custody_logs").insert({
            sample_id: newSampleId,
            performed_by_user_id: currentUser?.id?.toString() || "1",
            action: "Received at intake",
            comments: "Intake registered in database",
          });

          syncSamplesFromDb();
        } catch (err: any) {
          if (
            err.message?.includes("schema cache") ||
            err.message?.includes("relation") ||
            err.message?.includes("fetch") ||
            err.message?.includes("table") ||
            err.message?.includes("database")
          ) {
            toast.info("Database offline: saved to LIMS Sandbox memory");
          } else {
            toast.error(
              `LIMS Database Write Failed: ${err.message || "Could not register sample."}`,
            );
          }
        }
      };

      writeToDb();

      const updated = [newSample, ...currentSamples];
      localStorage.setItem("gcs_samples", JSON.stringify(updated));

      addActivity(currentName, "registered sample", newSampleId);
      addNotification(`Sample ${newSampleId} registered for ${newSample.client}`, "info");

      return updated;
    });

    // We return a mock/placeholder to satisfy typing if consumers depend on the return value immediately.
    // In actual implementation it might be better to return the generated newSample by refactoring.
    const newSampleId = `GCS-${24000 + samples.length}`;
    return {
      id: newSampleId,
      client: sampleData.client,
      project: sampleData.project,
      type: sampleData.type,
      status: "Received",
      receivedAt: new Date().toISOString(),
      technician: currentName,
      priority: sampleData.priority,
      location: sampleData.location,
      weight: sampleData.weight.endsWith(" kg") ? sampleData.weight : `${sampleData.weight} kg`,
      matrix: sampleData.matrix || "Sulphide",
      container: sampleData.container || "Calico Bag",
      receivedFrom: sampleData.receivedFrom || "Field Courier",
      specialInstructions: sampleData.specialInstructions,
      results: [],
    } as Sample;
  };

  const addSampleNote = (sampleId: string, comment: string) => {
    const newNote: SampleNote = {
      id: Date.now().toString(),
      author: currentName,
      comment,
      timestamp: new Date().toISOString(),
    };

    setSamples((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sampleId) {
          return {
            ...s,
            notes: [newNote, ...(s.notes || [])],
          };
        }
        return s;
      });
      localStorage.setItem("gcs_samples", JSON.stringify(updated));
      return updated;
    });

    const writeNoteToDb = async () => {
      try {
        const { error: noteErr } = await supabase.from("sample_notes").insert({
          sample_id: sampleId,
          author_user_id: currentUser?.id?.toString() || "1",
          comment,
        });

        if (noteErr) throw noteErr;
        syncSamplesFromDb();
      } catch (err: any) {
        if (
          err.message?.includes("schema cache") ||
          err.message?.includes("relation") ||
          err.message?.includes("fetch") ||
          err.message?.includes("table") ||
          err.message?.includes("database")
        ) {
          toast.info("Database offline: saved to LIMS Sandbox memory");
        } else {
          toast.error(`LIMS Database Write Failed: ${err.message || "Could not add sample note."}`);
        }
      }
    };

    writeNoteToDb();
    addActivity(currentName, "added a note to", sampleId);
  };

  const updateSampleStatus = (sampleId: string, status: SampleStatus) => {
    setSamples((prev) => {
      const updated = prev.map((s) => {
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
      localStorage.setItem("gcs_samples", JSON.stringify(updated));
      return updated;
    });

    const updateDb = async () => {
      try {
        const { error: sampleErr } = await supabase
          .from("samples")
          .update({ status })
          .eq("id", sampleId);

        if (sampleErr) throw sampleErr;

        await supabase.from("custody_logs").insert({
          sample_id: sampleId,
          performed_by_user_id: currentUser?.id?.toString() || "1",
          action: `Status updated to ${status}`,
          comments: `Moved through workflow step by ${currentName}`,
        });

        syncSamplesFromDb();
      } catch (err: any) {
        if (
          err.message?.includes("schema cache") ||
          err.message?.includes("relation") ||
          err.message?.includes("fetch") ||
          err.message?.includes("table") ||
          err.message?.includes("database")
        ) {
          toast.info("Database offline: saved to LIMS Sandbox memory");
        } else {
          toast.error(
            `LIMS Database Write Failed: ${err.message || "Could not update sample status."}`,
          );
        }
      }
    };

    updateDb();

    if (status === "Completed") {
      generateReportCallback(sampleId);
    }

    addActivity(currentName, `moved to ${status}`, sampleId);
  };

  const verifySample = async (sampleId: string, notes: string, storageLocation: string) => {
    setSamples((prev) => {
      const updated = prev.map((s) => {
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
      localStorage.setItem("gcs_samples", JSON.stringify(updated));
      return updated;
    });

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
      if (
        err.message?.includes("schema cache") ||
        err.message?.includes("relation") ||
        err.message?.includes("fetch") ||
        err.message?.includes("table") ||
        err.message?.includes("database")
      ) {
        toast.info("Database offline: saved to LIMS Sandbox memory");
      } else {
        toast.error(
          `LIMS Database Write Failed: ${err.message || "Could not accept and verify sample."}`,
        );
      }
    }

    addActivity(currentName, "verified sample", sampleId);
  };

  const rejectSample = async (sampleId: string, reason: string) => {
    setSamples((prev) => {
      const updated = prev.map((s) => {
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
      localStorage.setItem("gcs_samples", JSON.stringify(updated));
      return updated;
    });

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
      if (
        err.message?.includes("schema cache") ||
        err.message?.includes("relation") ||
        err.message?.includes("fetch") ||
        err.message?.includes("table") ||
        err.message?.includes("database")
      ) {
        toast.info("Database offline: saved to LIMS Sandbox memory");
      } else {
        toast.error(`LIMS Database Write Failed: ${err.message || "Could not reject sample."}`);
      }
    }

    addActivity(currentName, "rejected sample", sampleId);
  };

  const assignStorageLocation = async (sampleId: string, location: string) => {
    setSamples((prev) => {
      const updated = prev.map((s) => {
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
      localStorage.setItem("gcs_samples", JSON.stringify(updated));
      return updated;
    });

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
      if (
        err.message?.includes("schema cache") ||
        err.message?.includes("relation") ||
        err.message?.includes("fetch") ||
        err.message?.includes("table") ||
        err.message?.includes("database")
      ) {
        toast.info("Database offline: saved to LIMS Sandbox memory");
      } else {
        toast.error(
          `LIMS Database Write Failed: ${err.message || "Could not assign storage location."}`,
        );
      }
    }

    addActivity(currentName, "assigned storage to", sampleId);
  };

  const uploadSampleAttachment = async (sampleId: string, file: File) => {
    const filePath = `attachments/${sampleId}/${Date.now()}_${file.name}`;

    try {
      const { error: uploadErr } = await supabase.storage
        .from("sample-documents" as any)
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("sample-documents" as any).getPublicUrl(filePath);

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

      syncSamplesFromDb();
      return attachmentData;
    } catch (err: any) {
      console.warn("uploadSampleAttachment DB write bypassed, creating local mock:", err.message);

      const mockAttachment = {
        id: Date.now().toString(),
        name: file.name,
        filePath: "#",
        sizeBytes: file.size,
        uploadedBy: currentName,
        createdAt: new Date().toISOString(),
      };

      setSamples((prev) => {
        const updated = prev.map((s) => {
          if (s.id === sampleId) {
            return {
              ...s,
              attachments: [mockAttachment, ...(s.attachments || [])],
            };
          }
          return s;
        });
        localStorage.setItem("gcs_samples", JSON.stringify(updated));
        return updated;
      });

      return mockAttachment;
    }
  };

  const logBarcodeScan = async (sampleId: string, location: string, actionDetails: string) => {
    setSamples((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sampleId) {
          const newCustodyEntry: CustodyLogEntry = {
            action: `Barcode Scanned: ${actionDetails}`,
            technician: currentName,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          return {
            ...s,
            location: location || s.location,
            custody: [newCustodyEntry, ...(s.custody || [])],
          };
        }
        return s;
      });
      localStorage.setItem("gcs_samples", JSON.stringify(updated));
      return updated;
    });

    try {
      if (location) {
        await supabase.from("samples").update({ storage_location: location }).eq("id", sampleId);
      }

      await supabase.from("custody_logs").insert({
        sample_id: sampleId,
        performed_by_user_id: currentUser?.id?.toString() || "1",
        action: `Barcode Scanned: ${actionDetails}`,
        comments: `Scanned at: ${location || "Assigned station"}`,
      });

      syncSamplesFromDb();
    } catch (err: any) {
      if (
        err.message?.includes("schema cache") ||
        err.message?.includes("relation") ||
        err.message?.includes("fetch") ||
        err.message?.includes("table") ||
        err.message?.includes("database")
      ) {
        toast.info("Database offline: saved to LIMS Sandbox memory");
      } else {
        toast.error(`LIMS Database Write Failed: ${err.message || "Could not log barcode scan."}`);
      }
    }

    addActivity(currentName, `scanned barcode for ${sampleId}`, sampleId);
  };

  const fetchSampleDetails = async (sampleId: string) => {
    try {
      const { data, error } = await supabase
        .from("samples")
        .select(
          `
          *,
          sample_notes (*),
          custody_logs (*),
          analytical_results (*),
          sample_attachments (*)
        `,
        )
        .eq("id", sampleId)
        .single();

      if (error) throw error;

      if (data) {
        const mapped = mapDbSampleToUi(
          data,
          data.sample_notes || [],
          data.analytical_results || [],
          data.custody_logs || [],
          data.sample_attachments || [],
        );

        setSamples((prev) => {
          const idx = prev.findIndex((s) => s.id === sampleId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = mapped;
            localStorage.setItem("gcs_samples", JSON.stringify(updated));
            return updated;
          }
          return [mapped, ...prev];
        });
      }
    } catch (err: any) {
      console.warn(`Could not lazy load relations for ${sampleId}, using LIMS cache:`, err.message);
    }
  };

  return {
    samples,
    setSamples,
    saveSamples,
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
  };
}
