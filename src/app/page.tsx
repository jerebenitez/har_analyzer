"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestFlowAnalyzer } from "@/features/flow/analyzer";
import { RequestViewer } from "@/features/requests/requests";
import { HarUploader } from "@/features/upload/har-uploader";
import { HARData } from "@/lib/types";
import {
  Code,
  Cookie,
  Download,
  FileText,
  GitBranch,
  Upload,
} from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [HARData, setHARData] = useState<HARData | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedRequestIndex, setSelectedRequestIndex] = useState<number | undefined>(undefined)

  const handleHARUpload = (data: HARData) => {
    setHARData(data);
    setActiveTab("requests");
  };

  const handleRequestSelect = (index: number) => {
    setSelectedRequestIndex(index)
    setActiveTab("flow")
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            disabled={!HARData}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger
            value="flow"
            disabled={!HARData}
            className="flex items-center gap-2"
          >
            <GitBranch className="h-4 w-4" />
            Flow
          </TabsTrigger>
          <TabsTrigger
            value="cookies"
            disabled={!HARData}
            className="flex items-center gap-2"
          >
            <Cookie className="h-4 w-4" />
            Cookies
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            disabled={!HARData}
            className="flex items-center gap-2"
          >
            <Code className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger
            value="export"
            disabled={!HARData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-space-grotesk)]">
                Upload HAR File
              </CardTitle>
              <CardDescription>
                Upload a HAR (HTTP Archive) file to analyze HTTP requests,
                responses, and cookies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HarUploader onUpload={handleHARUpload} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="requests">
          {HARData && (
            <RequestViewer
              entries={HARData.log.entries}
              selectedRequestIndex={selectedRequestIndex}
              onRequestSelect={handleRequestSelect}
            />
          )}
        </TabsContent>
        <TabsContent value="flow">
        {HARData && (
            <RequestFlowAnalyzer
                entries={HARData.log.entries}
                selectedRequestIndex={selectedRequestIndex}
                onRequestSelect={handleRequestSelect}
            />
        )}
        </TabsContent>
        <TabsContent value="cookies">Cookies</TabsContent>
        <TabsContent value="analysis">Analysis</TabsContent>
        <TabsContent value="export">Export</TabsContent>
      </Tabs>
    </main>
  );
}
