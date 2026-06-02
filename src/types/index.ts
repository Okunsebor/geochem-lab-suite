export type SampleStatus =
  | "Received"
  | "Verified"
  | "Registered"
  | "In Preparation"
  | "In Analysis"
  | "Completed"
  | "Report Ready";
export const SAMPLE_STATUSES: SampleStatus[] = [
  "Received",
  "Verified",
  "Registered",
  "In Preparation",
  "In Analysis",
  "Completed",
  "Report Ready",
];
export type Priority = "Low" | "Normal" | "High" | "Rush";

export interface Sample {
  id: string;
  client: string;
  project: string;
  type: string;
  status: SampleStatus;
  receivedAt: string;
  technician: string;
  priority: Priority;
  location: string;
  weight: string;
  notes?: SampleNote[];
  results?: AnalyticalResult[];
  custody?: CustodyLogEntry[];
  matrix?: string;
  container?: string;
  receivedFrom?: string;
  specialInstructions?: string;
  acceptanceStatus?: "Pending" | "Accepted" | "Rejected";
  rejectionReason?: string;
  verificationNotes?: string;
  attachments?: {
    id: string;
    name: string;
    filePath: string;
    sizeBytes: number;
    uploadedBy: string;
    createdAt: string;
  }[];
}

export interface SampleNote {
  id: string;
  author: string;
  comment: string;
  timestamp: string;
}

export interface AnalyticalResult {
  element: string;
  value: string;
  unit: string;
  method: string;
  qa: "Pass" | "Flag" | "Pending Approval";
}

export interface CustodyLogEntry {
  action: string;
  technician: string;
  time: string;
  equipment?: string;
}

export interface KpiCardData {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  hint?: string;
}

export interface Instrument {
  id: string;
  name: string;
  status: "Online" | "Maintenance" | "Calibrating";
  queue: number;
  util: number;
  lastCalibrated?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Lab Coordinator" | "Customer";
  status: "Active" | "Invited" | "Suspended";
  lastSeen: string;
  organization?: string; // e.g. "Auric Mining Ltd" — for portal tenancy filtering
}

export interface ActivityLog {
  who: string;
  what: string;
  target: string;
  when: string;
  ip?: string;
}

export interface SystemNotification {
  id: number | string;
  title: string;
  time: string;
  createdAt?: string;
  body?: string;
  eventType?: string;
  audienceRole?: string;
  channel?: "in-app" | "email" | "workflow-alert";
  metadata?: Record<string, unknown>;
  kind: "alert" | "approval" | "info";
  isRead?: boolean;
  readAt?: string | null;
}

export interface ReportLog {
  id: string;
  reportId: string;
  status: "Draft" | "Pending Approval" | "Approved" | "Delivered" | "Revised";
  action: string;
  performedBy: string;
  comments?: string;
  createdAt: string;
}

export interface AnalyticalReport {
  id: string;
  sample: string;
  client: string;
  status: "Draft" | "Pending Approval" | "Approved" | "Delivered" | "Revised";
  createdAt: string;
  pages: number;
  pdfUrl?: string;
  comments?: string;
  approvedBy?: string;
  approvedAt?: string;
  deliveredBy?: string;
  deliveredAt?: string;
  history?: ReportLog[];
}


export interface AnomalyFlag {
  flagId: string;
  sample: string;
  element: string;
  checkType: string;
  severity: "Low" | "Medium" | "High";
  status: "Pending Approval" | "Approved" | "Revised";
}

export type PrepStage = "Drying" | "Crushing" | "Splitting" | "Pulverizing";

export type PrepStepStatus = "Queued" | "In Progress" | "Completed" | "Skipped";

export interface PrepStep {
  id: string;
  jobId: string;
  sampleId: string;
  stage: PrepStage;
  status: PrepStepStatus;
  technicianName: string;
  technicianId?: string;
  equipment?: string;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  notes?: string;
}

export interface PrepJob {
  id: string;
  sampleId: string;
  client: string;
  project: string;
  sampleType: string;
  priority: Priority;
  overallStatus: "Active" | "Completed" | "On Hold";
  currentStage: PrepStage;
  steps: PrepStep[];
  createdAt: string;
}

// ─── Analysis & QA/QC Types ───────────────────────────────────────────────────

export type RunStatus = "Queued" | "Running" | "Complete" | "Failed";
export type CheckType = "Duplicate" | "Blank" | "CRM" | "Standard" | "Spike";
export type FlagSeverity = "Low" | "Medium" | "High";
export type FlagStatus = "Open" | "Pending Approval" | "Approved" | "Revised";

export interface AnalyticalRun {
  id: string;
  sampleId: string;
  instrumentId: string;
  method: string;
  analystName: string;
  status: RunStatus;
  startedAt?: string;
  completedAt?: string;
  rawFileUrl?: string;
  rawFileName?: string;
  results: AnalyticalResultFull[];
}

export interface AnalyticalResultFull {
  id: string;
  runId: string;
  sampleId: string;
  element: string;
  value: number;
  unit: string;
  method: string;
  instrumentId: string;
  analystName: string;
  analyzedAt: string;
  qaStatus: "Pass" | "Flag" | "Pending Approval";
  flagReason?: string;
}

export interface CalibrationRecord {
  id: string;
  instrumentId: string;
  performedBy: string;
  calibrationDate: string;
  nextDueDate: string;
  standardUsed: string;
  r2Value: number;
  passStatus: boolean;
  notes?: string;
}

export interface QaFlag {
  id: string;
  sampleId: string;
  runId?: string;
  element: string;
  checkType: CheckType;
  observedValue: number;
  expectedValue?: number;
  tolerance?: number;
  percentDeviation?: number;
  severity: FlagSeverity;
  status: FlagStatus;
  raisedBy: string;
  raisedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface AnalyticalMethod {
  id: string;
  code: string;
  name: string;
  description: string;
  elementsTargeted: string[];
  instrumentTypes: string[];
  detectionLimits: Record<string, number>;
  qcThresholds: {
    duplicateRpd: number;
    blankMultiplier: number;
    crmTolerance: number;
  };
}
