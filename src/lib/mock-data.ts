export type SampleStatus =
  | "Received"
  | "Verified"
  | "In Preparation"
  | "In Analysis"
  | "Completed"
  | "Report Ready";

export const SAMPLE_STATUSES: SampleStatus[] = [
  "Received",
  "Verified",
  "In Preparation",
  "In Analysis",
  "Completed",
  "Report Ready",
];

export interface Sample {
  id: string;
  client: string;
  project: string;
  type: string;
  status: SampleStatus;
  receivedAt: string;
  technician: string;
  priority: "Low" | "Normal" | "High" | "Rush";
  location: string;
  weight: string;
}

const clients = ["Auric Mining Ltd", "Northstar Geo", "Pacific Resources", "Aurum Exploration", "Cascade Minerals", "Bedrock Labs"];
const projects = ["Drillhole AX-204", "Composite Survey", "Vein 12 Sample Pull", "Ore Lot 88", "Field Trip Q3", "Stockpile Audit"];
const types = ["Rock Chip", "Drill Core", "Soil", "Pulp", "Water", "Stream Sediment"];
const techs = ["E. Okafor", "M. Rivera", "K. Nakamura", "S. Patel", "J. Chen", "A. Volkov"];
const priorities: Sample["priority"][] = ["Normal", "Normal", "Normal", "High", "Low", "Rush"];

export const samples: Sample[] = Array.from({ length: 48 }).map((_, i) => {
  const status = SAMPLE_STATUSES[i % SAMPLE_STATUSES.length];
  const d = new Date();
  d.setDate(d.getDate() - (i % 21));
  return {
    id: `GCS-${(24000 + i).toString()}`,
    client: clients[i % clients.length],
    project: projects[i % projects.length],
    type: types[i % types.length],
    status,
    receivedAt: d.toISOString(),
    technician: techs[i % techs.length],
    priority: priorities[i % priorities.length],
    location: `Rack ${String.fromCharCode(65 + (i % 6))}-${(i % 12) + 1}`,
    weight: `${(0.4 + (i % 17) * 0.13).toFixed(2)} kg`,
  };
});

export const kpis = [
  { label: "Active Samples", value: "1,284", delta: "+12.4%", trend: "up" as const },
  { label: "Avg. Turnaround", value: "3.2d", delta: "-0.4d", trend: "up" as const },
  { label: "QA/QC Pass Rate", value: "98.6%", delta: "+0.8%", trend: "up" as const },
  { label: "Overdue", value: "7", delta: "-3", trend: "up" as const },
];

export const throughput = Array.from({ length: 14 }).map((_, i) => ({
  day: `D${i + 1}`,
  received: 30 + Math.round(Math.sin(i / 2) * 10 + Math.random() * 12),
  completed: 26 + Math.round(Math.cos(i / 2) * 8 + Math.random() * 10),
}));

export const workflowSplit = [
  { name: "Preparation", value: 312 },
  { name: "Analysis", value: 268 },
  { name: "QA/QC", value: 96 },
  { name: "Reporting", value: 84 },
];

export const instruments = [
  { id: "ICP-MS-01", name: "ICP-MS Agilent 7900", status: "Online", queue: 12, util: 86 },
  { id: "XRF-02", name: "XRF Bruker S8", status: "Online", queue: 5, util: 64 },
  { id: "FA-03", name: "Fire Assay Furnace #3", status: "Maintenance", queue: 0, util: 0 },
  { id: "AAS-04", name: "AAS PinAAcle 900", status: "Online", queue: 8, util: 72 },
  { id: "LECO-05", name: "LECO CS744", status: "Calibrating", queue: 3, util: 22 },
];

export const users = [
  { id: 1, name: "Adaeze Nwosu", email: "adaeze@geochem.io", role: "Admin", status: "Active", lastSeen: "2m ago" },
  { id: 2, name: "Marcus Rivera", email: "m.rivera@geochem.io", role: "Lab Coordinator", status: "Active", lastSeen: "12m ago" },
  { id: 3, name: "Keiko Nakamura", email: "keiko@geochem.io", role: "Lab Coordinator", status: "Active", lastSeen: "1h ago" },
  { id: 4, name: "Samir Patel", email: "samir@geochem.io", role: "Lab Coordinator", status: "Active", lastSeen: "3h ago" },
  { id: 5, name: "Jane Chen", email: "jane@auricmining.com", role: "Customer", status: "Active", lastSeen: "yesterday" },
  { id: 6, name: "Anders Volkov", email: "anders@northstar.geo", role: "Customer", status: "Invited", lastSeen: "—" },
];

export const activity = [
  { who: "M. Rivera", what: "approved report", target: "RPT-2041", when: "2 min ago" },
  { who: "K. Nakamura", what: "moved sample to Analysis", target: "GCS-24012", when: "14 min ago" },
  { who: "System", what: "QA/QC flag raised on", target: "GCS-24004", when: "32 min ago" },
  { who: "S. Patel", what: "registered batch of 24 samples", target: "Batch B-118", when: "1 hr ago" },
  { who: "Customer Jane Chen", what: "downloaded report", target: "RPT-2039", when: "2 hr ago" },
  { who: "A. Nwosu", what: "added new user", target: "anders@northstar.geo", when: "yesterday" },
];

export const notifications = [
  { id: 1, title: "Report RPT-2041 awaiting approval", time: "2m", kind: "approval" },
  { id: 2, title: "QA/QC anomaly on GCS-24004 — Au duplicate spread 18%", time: "32m", kind: "alert" },
  { id: 3, title: "Instrument ICP-MS-01 calibration due in 4h", time: "1h", kind: "info" },
  { id: 4, title: "3 samples overdue from Auric Mining Ltd", time: "3h", kind: "alert" },
  { id: 5, title: "New customer signup: Bedrock Labs", time: "1d", kind: "info" },
];

export const reports = Array.from({ length: 14 }).map((_, i) => ({
  id: `RPT-${2030 + i}`,
  sample: `GCS-${24000 + i * 2}`,
  client: clients[i % clients.length],
  status: ["Draft", "Pending Approval", "Approved", "Delivered", "Revised"][i % 5],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  pages: 4 + (i % 6),
}));
