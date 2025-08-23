"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatSize, formatTime, formatUrl, getMethodColor, getStatusColor } from "./utils";
import { Badge } from "@/components/ui/badge";
import { HarEntry } from "./requests";
import { ArrowRight, Clock, Globe } from "lucide-react";
import { DataTableColumnHeader } from "./requests-column-header";

export const columns: ColumnDef<HarEntry>[] = [
  {
    id: "datestamp",
    accessorKey: "startedDateTime",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Started at" />
    ),
    cell: ({ row }) => {
        const date = new Date(row.getValue("datestamp"))
        return <span className="text-muted-foreground">{date.toLocaleDateString()}{' '}{date.toLocaleTimeString()}{'.'}{date.getMilliseconds()}</span>
    }
  },
  {
    id: "method",
    accessorKey: "request.method",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Method" />
    ),
    cell: ({ row }) => (
      <Badge className={getMethodColor(row.getValue("method"))}>
        {row.getValue("method")}
      </Badge>
    ),
  },
  {
    id: "status",
    accessorKey: "response.status",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status Code" />
    ),
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
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
    ),
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
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Size" />
    ),
    cell: ({ row }) => <span className="text-muted-foreground text-xs">{formatSize(row.getValue("size"))}</span>
  }
];
