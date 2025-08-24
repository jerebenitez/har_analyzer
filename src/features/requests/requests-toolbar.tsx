"use client";

import { Input } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { DataTableFacetedFilter } from "./requests-faceted-filter";
import { Button } from "@/components/ui/button";
import { DataTableViewOptions } from "./requests-column-visibility";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

type Options = {
  label: string;
  value: string;
};

export function DataTableToolbar<TData>({
  table,
  methods,
  statuses,
}: DataTableToolbarProps<TData> & { methods: Options[]; statuses: Options[] }) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter entries..."
          value={(table.getColumn("urlInfo")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("urlInfo")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("method") && (
          <DataTableFacetedFilter
            column={table.getColumn("method")}
            title="Method"
            options={methods}
          />
        )}
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status code"
            options={statuses}
          />
        )}
        {table.getColumn("type") && (
          <DataTableFacetedFilter
            column={table.getColumn("type")}
            title="Type"
            options={[
              "HTML",
              "CSS",
              "JS",
              "XHR",
              "Fonts",
              "Images",
              "Media",
              "WS",
              "Other",
            ].map((t) => ({ label: t, value: t.toLowerCase() }))}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
