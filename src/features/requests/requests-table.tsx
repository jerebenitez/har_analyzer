"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";
import { DataTablePagination } from "./requests-pagination";
import { DataTableToolbar } from "./requests-toolbar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { RequestDetail } from "./request-detail";
import { HarEntry } from "./requests";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Extract unique methods and status codes for filters
  const { methods, statusCodes } = useMemo(() => {
    const methodSet = new Set<string>();
    const statusSet = new Set<string>();

    data.forEach((entry) => {
      methodSet.add(entry.request.method);
      statusSet.add(entry.response.status.toString());
    });

    return {
      methods: Array.from(methodSet)
        .sort()
        .map((m) => ({ label: m, value: m })),
      statusCodes: Array.from(statusSet)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map((sc) => ({ label: sc, value: sc })),
    };
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      columnFilters,
    },
  });

  return (
    <div className="space-y-6">
      <DataTableToolbar
        table={table}
        methods={methods}
        statuses={statusCodes}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                    <Collapsible key={row.id} asChild>
                    <>
                    <CollapsibleTrigger asChild>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    </CollapsibleTrigger>
                  <CollapsibleContent asChild>
                    <TableRow>
                        <TableCell colSpan={columns.length} className="p-0">
                            <div className="bg-muted/20 p-4">
                                <RequestDetail entry={row.original as HarEntry} />
                            </div>
                        </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {table.getRowModel().rows?.length > 0 && (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}
