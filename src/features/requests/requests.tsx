"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Clock,
  Globe,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HarEntry {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);

  // Extract unique methods and status codes for filters
  const { methods, statusCodes } = useMemo(() => {
    const methodSet = new Set<string>();
    const statusSet = new Set<number>();

    entries.forEach((entry) => {
      methodSet.add(entry.request.method);
      statusSet.add(entry.response.status);
    });

    return {
      methods: Array.from(methodSet).sort(),
      statusCodes: Array.from(statusSet).sort((a, b) => a - b),
    };
  }, [entries]);

  // Filter entries based on search and filters
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.request.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.request.method.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod =
        methodFilter === "all" || entry.request.method === methodFilter;
      const matchesStatus =
        statusFilter === "all" ||
        entry.response.status.toString() === statusFilter;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [entries, searchTerm, methodFilter, statusFilter]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300)
      return "bg-green-100 text-green-800 border-green-200";
    if (status >= 300 && status < 400)
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (status >= 400 && status < 500)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (status >= 500) return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "POST":
        return "bg-green-100 text-green-800 border-green-200";
      case "PUT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DELETE":
        return "bg-red-100 text-red-800 border-red-200";
      case "PATCH":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return {
        domain: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        full: url,
      };
    } catch {
      return {
        domain: "",
        path: url,
        full: url,
      };
    }
  };

  const formatTime = (time: number) => {
    if (time < 1000) return `${Math.round(time)} ms`;
    return `${(time / 1000).toFixed(2)} s`;
  };

  const formatSize = (size: number) => {
    if (Number.isNaN(size) || size === undefined) return "-1 B";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-space-grotesk)]">
            HTTP Requests
          </CardTitle>
          <CardDescription>
            Showing {filteredEntries.length} of {entries.length} requests
            {selectedRequestIndex !== undefined && (
              <span className="ml-2 text-primary">
                • Request #{selectedRequestIndex + 1} selected for flow analysis
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requests by URL or method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {methods
                    .filter((method) => method && method.trim() !== "")
                    .map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusCodes
                    .filter((status) => status && status > 0)
                    .map((status) => (
                      <SelectItem key={status} value={status.toString()}>
                        {status}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request List */}
      <div className="space-y-2">
        {filteredEntries.map((entry, filteredIndex) => {
          const originalIndex = entries.findIndex((e) => e === entry);
          const urlInfo = formatUrl(entry.request.url);
          const isExpanded = expandedRequest === originalIndex;
          const isSelected = selectedRequestIndex === originalIndex;

          return (
            <Card
              key={originalIndex}
              className={`transition-colors ${isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-card/50"}`}
            >
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader
                    className="cursor-pointer pb-3"
                    onClick={() => {
                      setExpandedRequest(isExpanded ? null : originalIndex);
                      if (onRequestSelect) {
                        onRequestSelect(originalIndex);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <Badge
                            className={`${getMethodColor(entry.request.method)} border`}
                          >
                            #{originalIndex + 1} {entry.request.method}
                          </Badge>
                          <Badge
                            className={`${getStatusColor(entry.response.status)} border`}
                          >
                            {entry.response.status}
                          </Badge>
                          {isSelected && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-primary/10 text-primary border-primary/20"
                            >
                              Flow Analysis
                            </Badge>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-sm max-w-full">
                            <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate font-mono text-muted-foreground">
                              {urlInfo.domain}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate font-mono text-xs">
                              {urlInfo.path}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(entry.time)}
                        </div>
                        <div>{formatSize(entry.response.content.size)}</div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <RequestDetails entry={entry} />
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {filteredEntries.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No requests match your current filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RequestDetails({ entry }: { entry: HarEntry }) {
  const [activeTab, setActiveTab] = useState("headers");

  const formatHeaders = (headers: Array<{ name: string; value: string }>) => {
    return headers.map((header, index) => (
      <div
        key={index}
        className="grid grid-cols-3 gap-4 py-2 border-b border-border last:border-0"
      >
        <div className="font-mono text-sm font-medium">{header.name}</div>
        <div className="col-span-2 font-mono text-sm break-all">
          {header.value}
        </div>
      </div>
    ));
  };

  const formatJson = (text: string) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">URL:</span>
          <div className="font-mono text-xs break-all mt-1 p-2 bg-muted rounded">
            {entry.request.url}
          </div>
        </div>
        <div>
          <span className="font-medium">Started:</span>
          <div className="mt-1">
            {new Date(entry.startedDateTime).toLocaleString()}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="headers">Request Headers</TabsTrigger>
          <TabsTrigger value="response-headers">Response Headers</TabsTrigger>
          {entry.request.postData && (
            <TabsTrigger value="body">Request Body</TabsTrigger>
          )}
          {entry.response.content.text && (
            <TabsTrigger value="response">Response</TabsTrigger>
          )}
          {entry.request.queryString.length > 0 && (
            <TabsTrigger value="params">Parameters</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="headers" className="mt-4">
          <div className="border rounded-lg p-4 bg-card">
            {formatHeaders(entry.request.headers)}
          </div>
        </TabsContent>

        <TabsContent value="response-headers" className="mt-4">
          <div className="border rounded-lg p-4 bg-card">
            {formatHeaders(entry.response.headers)}
          </div>
        </TabsContent>

        {entry.request.postData && (
          <TabsContent value="body" className="mt-4">
            <div className="border rounded-lg p-4 bg-card">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                {entry.request.postData.mimeType.includes("json")
                  ? formatJson(entry.request.postData.text)
                  : entry.request.postData.text}
              </pre>
            </div>
          </TabsContent>
        )}

        {entry.response.content.text && (
          <TabsContent value="response" className="mt-4">
            <div className="border rounded-lg p-4 bg-card">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all max-h-96 overflow-auto">
                {entry.response.content.mimeType.includes("json")
                  ? formatJson(entry.response.content.text)
                  : entry.response.content.text}
              </pre>
            </div>
          </TabsContent>
        )}

        {entry.request.queryString.length > 0 && (
          <TabsContent value="params" className="mt-4">
            <div className="border rounded-lg p-4 bg-card">
              {entry.request.queryString.map((param, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 py-2 border-b border-border last:border-0"
                >
                  <div className="font-mono text-sm font-medium">
                    {param.name}
                  </div>
                  <div className="col-span-2 font-mono text-sm break-all">
                    {param.value}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
