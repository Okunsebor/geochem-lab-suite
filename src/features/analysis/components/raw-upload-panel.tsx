import React, { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle2, AlertTriangle, Table } from "lucide-react";
import { AnalyticalResultFull } from "../../../types";
import { parseCsv } from "../../../lib/qa-service";

interface RawUploadPanelProps {
  runId: string;
  onUpload: (file: File) => Promise<{ url: string | null; results: AnalyticalResultFull[] }>;
}

export function RawUploadPanel({ runId, onUpload }: RawUploadPanelProps) {
  const [file, setFile]               = useState<File | null>(null);
  const [preview, setPreview]         = useState<string[][]>([]);
  const [uploading, setUploading]     = useState(false);
  const [uploadResult, setUploadResult] = useState<{ url: string | null; count: number } | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setUploadResult(null);
    if (f.name.endsWith(".csv") || f.type === "text/csv") {
      const text = await f.text();
      const lines = text.trim().split(/\r?\n/).slice(0, 11); // header + 10 rows
      setPreview(lines.map((l) => l.split(",").map((c) => c.trim())));
    } else {
      setPreview([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleConfirmUpload = async () => {
    if (!file) return;
    setUploading(true);
    const { url, results } = await onUpload(file);
    setUploadResult({ url, count: results.length });
    setUploading(false);
  };

  const reset = () => { setFile(null); setPreview([]); setUploadResult(null); };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3 bg-muted/20">
        <Upload className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Raw Data Upload</h3>
        <span className="ml-auto text-xs font-mono text-muted-foreground">{runId}</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Drop zone */}
        {!file && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-all
              ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/20"}`}
          >
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="size-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Drop instrument file here</p>
              <p className="text-xs text-muted-foreground mt-1">CSV export from instrument software · max 50 MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt,.xls,.xlsx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* File selected */}
        {file && !uploadResult && (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
              <FileText className="size-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={reset} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            {/* CSV Preview */}
            {preview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Table className="size-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Preview — first {Math.min(preview.length - 1, 10)} rows
                  </p>
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="text-xs w-full">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        {(preview[0] || []).map((h, i) => (
                          <th key={i} className="px-3 py-2 text-left font-semibold text-muted-foreground">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.slice(1).map((row, ri) => (
                        <tr key={ri} className="hover:bg-muted/20">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-1.5 font-mono text-foreground">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-md gradient-primary px-4 py-2 text-xs text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {uploading ? (
                  <><span className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing…</>
                ) : (
                  <><Upload className="size-3.5" /> Confirm Import</>
                )}
              </button>
              <button onClick={reset} className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition">
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Success */}
        {uploadResult && (
          <div className="flex items-center gap-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
            <CheckCircle2 className="size-8 text-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Import complete — {uploadResult.count} results registered
              </p>
              {uploadResult.url && (
                <a href={uploadResult.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline">
                  View raw file ↗
                </a>
              )}
            </div>
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground font-semibold">
              Upload another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
