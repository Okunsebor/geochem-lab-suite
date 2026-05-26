import React from "react";
import { Search } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  headers: React.ReactNode[];
  renderRow: (item: T, index: number) => React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  totalCount?: number;
  filteredCount?: number;
}

export function DataTable<T>({
  data,
  headers,
  renderRow,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  pagination,
  totalCount,
  filteredCount,
}: DataTableProps<T>) {
  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Search and Filters Bar */}
      {(onSearchChange !== undefined || filters || totalCount !== undefined) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          {onSearchChange !== undefined && (
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={searchQuery || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm"
              />
            </div>
          )}
          
          {filters}
          
          {totalCount !== undefined && (
            <div className="ml-auto text-xs text-muted-foreground">
              {filteredCount !== undefined ? `${filteredCount} of ` : ""}
              {totalCount} items
            </div>
          )}
        </div>
      )}

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-left [&>th]:font-medium border-b border-border">
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-muted-foreground">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="rounded border border-border px-2 py-1 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              Prev
            </button>
            {Array.from({ length: pagination.totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => pagination.onPageChange(i + 1)}
                className={`rounded border px-2 py-1 ${
                  pagination.currentPage === i + 1
                    ? "border-border bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() =>
                pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))
              }
              disabled={pagination.currentPage === pagination.totalPages}
              className="rounded border border-border px-2 py-1 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
