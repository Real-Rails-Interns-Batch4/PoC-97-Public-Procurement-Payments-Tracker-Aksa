import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Transaction } from "../lib/api";
import { Search, Download, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";

interface DataTableProps {
  data: Transaction[];
  onExport: () => void;
}

const columnHelper = createColumnHelper<Transaction>();

export const DataTable: React.FC<DataTableProps> = ({ data, onExport }) => {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      columnHelper.accessor("award_id", {
        header: () => (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Award ID
          </span>
        ),
        cell: (info) => <span className="font-mono text-xs font-semibold text-gray-300">{info.getValue()}</span>,
      }),
      columnHelper.accessor("agency_name", {
        header: () => (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Agency
          </span>
        ),
        cell: (info) => <span className="truncate max-w-[120px] block text-gray-400">{info.getValue()}</span>,
      }),
      columnHelper.accessor("vendor_name", {
        header: () => (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Vendor
          </span>
        ),
        cell: (info) => <span className="truncate max-w-[120px] block text-gray-300 font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor("award_amount", {
        header: () => (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Award Val
          </span>
        ),
        cell: (info) => {
          const val = Number(info.getValue() ?? 0);
          return (
            <span className="font-bold text-gray-200">
              ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          );
        },
      }),
      columnHelper.accessor("invoice_id", {
        header: () => (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Invoice ID
          </span>
        ),
        cell: (info) => <span className="font-mono text-[10px] text-gray-400">{info.getValue()}</span>,
      }),
      columnHelper.accessor("invoice_amount", {
        header: () => (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Invoice Val
          </span>
        ),
        cell: (info) => {
          const val = Number(info.getValue() ?? 0);
          return (
            <span className="text-gray-300">
              ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          );
        },
      }),
      columnHelper.accessor("payment_status", {
        header: () => (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Payment Status
          </span>
        ),
        cell: (info) => {
          const val = info.getValue();
          let color = "text-gray-400 bg-gray-900 border-gray-800";
          if (val === "Completed") color = "text-emerald-400 bg-emerald-950/40 border-emerald-900/50";
          else if (val === "Delayed") color = "text-rose-400 bg-rose-950/40 border-rose-900/50";
          else if (val === "In Progress") color = "text-sky-400 bg-sky-950/40 border-sky-900/50";
          
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}>
              {val}
            </span>
          );
        },
      }),
      columnHelper.accessor("completion_days", {
        header: () => (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Time to Pay
          </span>
        ),
        cell: (info) => {
          const val = info.getValue();
          if (val === null) return <span className="text-gray-500">—</span>;
          
          let color = "text-emerald-400";
          if (val > 35) color = "text-rose-400 font-semibold";
          else if (val > 20) color = "text-amber-400";
          
          return <span className={color}>{val} days</span>;
        },
      }),
      columnHelper.accessor("award_source", {
        header: () => (
          <span className="flex items-center gap-1">
            Source Split
          </span>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-col gap-1 text-[9px] font-semibold">
              <span className="text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30 truncate max-w-[110px] text-center font-mono">
                {row.award_source ? "🟢 " + row.award_source.replace("Real (", "").replace(")", "") : "🟢 USAspending"}
              </span>
              <span className="text-amber-400 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/30 truncate max-w-[110px] text-center font-mono">
                {row.payment_source ? "🟠 " + row.payment_source.replace("Synthetic (", "").replace(")", "") : "🟠 Simulated"}
              </span>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="rounded-xl border border-gray-800 bg-[#0B1117]/80 p-6 shadow-lg backdrop-blur-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-gray-200">
            Procurement Payment Ledger
          </h4>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Browse and query granular awards, invoice checkpoints, and payment delivery times.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search ID, agency, vendor..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 w-60 rounded-lg border border-gray-800 bg-gray-900/60 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          
          {/* Export to CSV */}
          <button
            onClick={onExport}
            className="flex h-9 items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/80 px-4 text-xs font-semibold text-gray-300 hover:border-gray-700 hover:text-white transition-all hover:bg-gray-900 group"
          >
            <Download className="h-3.5 w-3.5 text-gray-400 group-hover:text-white" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-800 text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-950/20">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-semibold">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-xs text-gray-500">
                  No matching transaction rows found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="text-xs hover:bg-gray-900/25 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {table.getPageCount() > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>
            Page <strong className="text-white">{table.getState().pagination.pageIndex + 1}</strong> of{" "}
            <strong className="text-white">{table.getPageCount()}</strong> ({data.length} records)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-800 bg-gray-900/40 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-800 bg-gray-900/40 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
