import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Filter, Plus, Upload, MoreHorizontal, ScanBarcode } from "lucide-react";
import { useLimsState } from "../../../hooks/use-lims-state";
import { DataTable } from "../../../components/shared/data-table";
import { StatusBadge } from "../../../components/lims/status-badge";
import { PageHeader } from "../../../components/lims/page-header";
import { SAMPLE_STATUSES } from "../../../lib/mock-data";

export function SamplesFilterTable() {
  const { samples } = useLimsState();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filtered = samples.filter(
    (s) =>
      (status === "All" || s.status === status) &&
      (q === "" ||
        s.id.toLowerCase().includes(q.toLowerCase()) ||
        s.client.toLowerCase().includes(q.toLowerCase()) ||
        s.project.toLowerCase().includes(q.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const headers = [
    <input type="checkbox" key="check" className="rounded" />,
    "Sample ID",
    "Client",
    "Project",
    "Type",
    "Priority",
    "Technician",
    "Storage",
    "Status",
    "",
  ];

  const renderRow = (s: any) => (
    <tr key={s.id} className="border-t border-border hover:bg-muted/30 [&>td]:px-4 [&>td]:py-2.5 transition-colors">
      <td>
        <input type="checkbox" className="rounded" />
      </td>
      <td className="font-mono text-xs">
        <Link to="/app/samples/$id" params={{ id: s.id }} className="text-primary hover:underline font-medium">
          {s.id}
        </Link>
      </td>
      <td className="font-medium">{s.client}</td>
      <td className="text-muted-foreground">{s.project}</td>
      <td>{s.type}</td>
      <td>
        <StatusBadge status={s.priority} />
      </td>
      <td>{s.technician}</td>
      <td className="font-mono text-xs">{s.location}</td>
      <td>
        <StatusBadge status={s.status} />
      </td>
      <td>
        <button className="rounded p-1 hover:bg-muted cursor-pointer">
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </button>
      </td>
    </tr>
  );

  const filtersSlot = (
    <>
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setCurrentPage(1);
        }}
        className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none cursor-pointer focus:border-primary"
      >
        <option value="All">All Statuses</option>
        {SAMPLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm hover:bg-muted cursor-pointer transition">
        <Filter className="size-3.5" /> Filters
      </button>
      <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm hover:bg-muted cursor-pointer transition">
        <ScanBarcode className="size-3.5" /> Scan
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Samples" }]}
        title="Samples"
        description="Manage every sample in the lab — registration to delivery."
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted cursor-pointer transition">
              <Upload className="size-3.5" /> Import
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted cursor-pointer transition">
              <Download className="size-3.5" /> Export
            </button>
            <Link
              to="/app/intake"
              className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white font-medium hover:opacity-90 shadow-sm transition cursor-pointer"
            >
              <Plus className="size-3.5" /> Register
            </Link>
          </>
        }
      />

      <DataTable
        data={paginatedData}
        headers={headers}
        renderRow={renderRow}
        searchQuery={q}
        onSearchChange={(val) => {
          setQ(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by ID, client or project…"
        filters={filtersSlot}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
        totalCount={samples.length}
        filteredCount={filtered.length}
      />
    </div>
  );
}
