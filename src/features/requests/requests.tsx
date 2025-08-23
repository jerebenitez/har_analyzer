"use client";

import { DataTable } from "./requests-table";
import { columns } from "./request-columns";

export interface HarEntry {
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    cookies: Array<{ name: string; value: string }>;
    queryString: Array<{ name: string; value: string }>;
    postData?: {
      mimeType: string;
      text: string;
    };
  };
  response: {
    status: number;
    statusText: string;
    headers: Array<{ name: string; value: string }>;
    cookies: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
      text?: string;
    };
  };
  startedDateTime: string;
  time: number;
}

interface RequestViewerProps {
  entries: HarEntry[];
  selectedRequestIndex?: number;
  onRequestSelect?: (index: number) => void;
}

export function RequestViewer({
  entries,
  selectedRequestIndex,
  onRequestSelect,
}: RequestViewerProps) {
  return (
      <DataTable columns={columns} data={entries} />
  );
}
