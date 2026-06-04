import React, { useState } from "react";
import { useLimsState } from "../../../hooks/use-lims-state";
import { PageHeader } from "../../../components/layout/PageHeader";
import { DataTable } from "../../../components/shared/data-table";

export function ActivityLogsTable() {
  const { activity } = useLimsState();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const totalPages = Math.ceil(activity.length / itemsPerPage);
  const paginatedData = activity.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const headers = ["Time", "Actor", "Action", "Target", "IP"];

  const renderRow = (a: any, idx: number) => (
    <tr
      key={idx}
      className="border-t border-border hover:bg-muted/30 [&>td]:px-4 [&>td]:py-2.5 font-medium transition-colors"
    >
      <td className="text-muted-foreground text-xs">{a.when}</td>
      <td className="font-semibold text-foreground">{a.who}</td>
      <td className="text-muted-foreground">{a.what}</td>
      <td className="font-mono text-xs text-primary">{a.target}</td>
      <td className="text-muted-foreground text-xs">{a.ip || `10.0.1.${20 + idx}`}</td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Operations" }, { label: "Activity Logs" }]}
        title="Activity Logs"
        description="Full audit trail of every action across the platform."
      />

      <DataTable
        data={paginatedData}
        headers={headers}
        renderRow={renderRow}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
        totalCount={activity.length}
      />
    </div>
  );
}
