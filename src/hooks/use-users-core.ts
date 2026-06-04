import { useState } from "react";
import { User } from "../types";
import { supabase } from "../lib/supabase";

export function useUsersCore(
  currentName: string,
  addActivity: (who: string, what: string, target: string) => void,
) {
  const [users, setUsers] = useState<User[]>([]);

  const [tickets, setTickets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("gcs_tickets");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("gcs_settings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      orgName: "GeoChem Labs Inc.",
      orgUrl: "geochemlabs.suite.io",
      timezone: "UTC+01 · Lagos",
      currency: "USD",
      labProtocol: "ISO 17025 Accreditation",
      calInterval: "14 days",
      auditRetention: "7 years",
      matrixType: "Sulphide",
      primaryColor: "#00AEEF",
      logo: "",
      reportFooter: "© GeoChem Labs Inc. · ISO 17025 Accredited · contact@geochem.io",
      triggers: [
        "Report awaiting approval",
        "QA anomaly raised",
        "Sample overdue",
        "Instrument calibration due",
        "New customer signup",
      ],
      channels: ["In-app", "Email"],
      require2fa: true,
      sessionExpire: true,
      passRotation: "90 days",
      maxFailures: "5 attempts",
      apiKey: "sk_live_51Ny931Jkdsj92842Jksdlf...",
      webhookUrl: "https://api.geochemlabs.io/v1/webhooks",
      webhookHash: "whsec_kdjf892429...",
    };
  });

  const saveUsers = (data: User[]) => {
    setUsers(data);
    localStorage.setItem("gcs_users", JSON.stringify(data));
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
    addActivity(currentName, "invited user", email);
  };

  const addSupportTicket = (ticket: any) => {
    setTickets((prev) => {
      const updated = [ticket, ...prev];
      localStorage.setItem("gcs_tickets", JSON.stringify(updated));
      return updated;
    });
  };

  const updateSettings = (newSettings: any) => {
    setSettings((prev: any) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("gcs_settings", JSON.stringify(updated));
      return updated;
    });
  };

  const fetchUsers = async () => {
    const { data: usersData, error: usersErr } = await supabase.from("users").select("*");
    if (!usersErr && usersData) {
      saveUsers(usersData);
    } else {
      saveUsers([]);
    }
  };

  return {
    users,
    setUsers,
    saveUsers,
    tickets,
    setTickets,
    settings,
    setSettings,
    inviteUser,
    addSupportTicket,
    updateSettings,
    fetchUsers,
  };
}
