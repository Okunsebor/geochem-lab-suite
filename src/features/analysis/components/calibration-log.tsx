import React, { useState } from "react";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { CalibrationRecord, Instrument } from "../../../types";

interface CalibrationLogProps {
  calibrationRecords: CalibrationRecord[];
  instruments: Instrument[];
  onAddRecord: (record: Omit<CalibrationRecord, "id">) => void;
}

function CalibrationFormModal({
  instruments,
  onSave,
  onClose,
}: {
  instruments: Instrument[];
  onSave: (record: Omit<CalibrationRecord, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    instrumentId: instruments[0]?.id || "",
    performedBy: "",
    standardUsed: "",
    r2Value: "",
    passStatus: true,
    notes: "",
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    const now = new Date();
    const nextDue = new Date(now.getTime() + 24 * 3600000);
    onSave({
      instrumentId: form.instrumentId,
      performedBy: form.performedBy,
      standardUsed: form.standardUsed,
      r2Value: parseFloat(form.r2Value) || 0.999,
      passStatus: form.passStatus,
      notes: form.notes || undefined,
      calibrationDate: now.toISOString(),
      nextDueDate: nextDue.toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Log Calibration Record</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Instrument
            </label>
            <select
              value={form.instrumentId}
              onChange={(e) => set("instrumentId", e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {instruments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.id})
                </option>
              ))}
            </select>
          </div>
          {[
            { label: "Performed By", key: "performedBy", placeholder: "Analyst name" },
            { label: "Standard Used", key: "standardUsed", placeholder: "OREAS 234" },
            { label: "R² Value", key: "r2Value", placeholder: "0.9994" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {label}
              </label>
              <input
                value={(form as any)[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="passStatus"
              checked={form.passStatus}
              onChange={(e) => set("passStatus", e.target.checked)}
              className="size-4 rounded"
            />
            <label htmlFor="passStatus" className="text-sm font-medium text-foreground">
              Calibration passed
            </label>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-border bg-background py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-md gradient-primary py-2 text-sm text-white font-semibold hover:opacity-90 transition"
          >
            Save Record
          </button>
        </div>
      </div>
    </div>
  );
}

export function CalibrationLog({
  calibrationRecords,
  instruments,
  onAddRecord,
}: CalibrationLogProps) {
  const [showForm, setShowForm] = useState(false);

  // Chart data: R² per calibration run
  const chartData = calibrationRecords
    .slice(0, 12)
    .reverse()
    .map((c, i) => ({
      run: `R${i + 1}`,
      r2: c.r2Value,
      pass: c.passStatus,
      instrument: c.instrumentId,
    }));

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-muted/20">
        <h3 className="text-sm font-semibold text-foreground">Calibration &amp; Drift Log</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-md gradient-primary px-2.5 py-1.5 text-xs text-white font-semibold hover:opacity-90 transition"
        >
          <Plus className="size-3" /> Log Calibration
        </button>
      </div>

      {/* R² chart */}
      <div className="px-5 pt-4 pb-2 h-48">
        <ResponsiveContainer>
          <BarChart data={chartData} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="run" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis
              domain={[0.99, 1.0]}
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickFormatter={(v) => v.toFixed(4)}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [v.toFixed(4), "R²"]}
            />
            <ReferenceLine
              y={0.999}
              stroke="hsl(158 64% 48%)"
              strokeDasharray="4 2"
              label={{ value: "R²=0.999", fill: "hsl(158 64% 48%)", fontSize: 10 }}
            />
            <Bar dataKey="r2" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent records table */}
      <div className="overflow-x-auto border-t border-border">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground bg-muted/30 border-b border-border">
            <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-left [&>th]:font-semibold">
              <th>Instrument</th>
              <th>Standard</th>
              <th>R²</th>
              <th>Analyst</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {calibrationRecords.slice(0, 5).map((c) => (
              <tr
                key={c.id}
                className="border-b border-border last:border-0 [&>td]:px-4 [&>td]:py-2 font-medium hover:bg-muted/20 transition"
              >
                <td className="font-mono">{c.instrumentId}</td>
                <td>{c.standardUsed}</td>
                <td className="font-mono">{c.r2Value.toFixed(4)}</td>
                <td>{c.performedBy}</td>
                <td className="text-muted-foreground">
                  {new Date(c.calibrationDate).toLocaleDateString()}
                </td>
                <td>
                  {c.passStatus ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="size-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-600 font-semibold">
                      <XCircle className="size-3.5" /> Fail
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <CalibrationFormModal
          instruments={instruments}
          onSave={(rec) => {
            onAddRecord(rec);
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
