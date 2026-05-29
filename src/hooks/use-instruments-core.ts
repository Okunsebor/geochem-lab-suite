import { useState } from "react";
import { Instrument } from "../types";
import { supabase } from "../lib/supabase";

export function useInstrumentsCore(
  currentName: string,
  addActivity: (who: string, what: string, target: string) => void
) {
  const [instruments, setInstruments] = useState<Instrument[]>([]);

  const saveInstruments = (data: Instrument[]) => {
    setInstruments(data);
    localStorage.setItem("gcs_instruments", JSON.stringify(data));
  };

  const toggleInstrumentStatus = (
    instrumentId: string,
    status: Instrument["status"]
  ) => {
    setInstruments((prev) => {
      const updated = prev.map((i) => {
        if (i.id === instrumentId) {
          return { ...i, status };
        }
        return i;
      });
      localStorage.setItem("gcs_instruments", JSON.stringify(updated));
      return updated;
    });

    addActivity(currentName, `changed instrument ${instrumentId} status to ${status}`, instrumentId);
  };

  const fetchInstruments = async () => {
    const { data: instrumentsData, error: instrumentsErr } = await supabase.from("instruments").select("*");
    if (!instrumentsErr && instrumentsData) {
      const mapped = instrumentsData.map((i: any) => ({
        ...i,
        status: i.status as Instrument["status"],
        lastCalibrated: "14h ago",
      }));
      saveInstruments(mapped);
    } else {
      saveInstruments([]);
    }
  };

  return { instruments, setInstruments, saveInstruments, toggleInstrumentStatus, fetchInstruments };
}
