"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatSize, formatTime, formatUrl, getMethodColor, getStatusColor, UrlInfo } from "./utils";
import { Badge } from "@/components/ui/badge";
import { HarEntry } from "./requests";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Clock, Globe } from "lucide-react";

export const columns: ColumnDef<HarEntry>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "method",
    accessorKey: "request.method",
    header: "Method",
    cell: ({ row }) => (
      <Badge className={getMethodColor(row.getValue("method"))}>
        {row.getValue("method")}
      </Badge>
    ),
  },
  {
    id: "status",
    accessorKey: "response.status",
    header: "Status Code",
    cell: ({ row }) => (
      <Badge className={getStatusColor(row.getValue("status"))}>
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    id: "urlInfo",
    accessorKey: "request.url",
    header: "",
    cell: ({ row }) => {
      const urlInfo = formatUrl(row.getValue("urlInfo"));

      return (
        <div className="flex items-center gap-2 text-sm max-w-96">
          <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="truncate font-mono text-muted-foreground">
            {urlInfo.domain}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="truncate font-mono text-xs">{urlInfo.path}</span>
        </div>
      );
    },
  },
  {
    id: "time",
    accessorKey: "time",
    header: "Time",
    cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTime(row.getValue("time"))}
        </div>
    )
  },
  {
    id: "size",
    accessorKey: "response.content.size",
    header: "Size",
    cell: ({ row }) => <span className="text-muted-foreground text-xs">{formatSize(row.getValue("size"))}</span>
  }
];
