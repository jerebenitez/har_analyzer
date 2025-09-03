import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { HarEntry } from "./requests";

export function RequestDetail({ entry }: { entry: HarEntry }) {
   const [activeTab, setActiveTab] = useState("headers")

  const formatHeaders = (headers: Array<{ name: string; value: string }>) => {
    return headers.map((header, index) => (
      <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b border-border last:border-0">
        <div className="font-mono text-sm font-medium">{header.name}</div>
        <div className="col-span-2 font-mono text-sm break-all">{header.value}</div>
      </div>
    ))
  }

  const formatJson = (text: string) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2)
    } catch {
      return text
    }
  } 

  return (
<div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">URL:</span>
          <div className="font-mono text-xs break-all mt-1 p-2 bg-muted rounded">{entry.request.url}</div>
        </div>
        <div>
          <span className="font-medium">Started:</span>
          <div className="mt-1">{new Date(entry.startedDateTime).toLocaleString()}</div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="headers">Request Headers</TabsTrigger>
          <TabsTrigger value="response-headers">Response Headers</TabsTrigger>
          {entry.request.postData && <TabsTrigger value="body">Request Body</TabsTrigger>}
          {entry.response.content.text && <TabsTrigger value="response">Response</TabsTrigger>}
          {entry.request.queryString.length > 0 && <TabsTrigger value="params">Parameters</TabsTrigger>}
        </TabsList>

        <TabsContent value="headers" className="mt-4">
          <div className="border rounded-lg p-4 bg-card">{formatHeaders(entry.request.headers)}</div>
        </TabsContent>

        <TabsContent value="response-headers" className="mt-4">
          <div className="border rounded-lg p-4 bg-card">{formatHeaders(entry.response.headers)}</div>
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
                <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b border-border last:border-0">
                  <div className="font-mono text-sm font-medium">{param.name}</div>
                  <div className="col-span-2 font-mono text-sm break-all">{param.value}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
    )
}
