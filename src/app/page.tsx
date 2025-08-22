import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Cookie,
  Download,
  FileText,
  GitBranch,
  Upload,
} from "lucide-react";

export default function Home() {
  const harData = true;
  return (
    <main className="container mx-auto px-4 py-8">
      <Tabs className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            disabled={!harData}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger
            value="flow"
            disabled={!harData}
            className="flex items-center gap-2"
          >
            <GitBranch className="h-4 w-4" />
            Flow
          </TabsTrigger>
          <TabsTrigger
            value="cookies"
            disabled={!harData}
            className="flex items-center gap-2"
          >
            <Cookie className="h-4 w-4" />
            Cookies
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            disabled={!harData}
            className="flex items-center gap-2"
          >
            <Code className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger
            value="export"
            disabled={!harData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
            Upload
        </TabsContent>
        <TabsContent value="requests">
            Requests
        </TabsContent>
        <TabsContent value="flow">
            Flow
        </TabsContent>
        <TabsContent value="cookies">
            Cookies
        </TabsContent>
        <TabsContent value="analysis">
            Analysis
        </TabsContent>
        <TabsContent value="export">
            Export
        </TabsContent>
      </Tabs>
    </main>
  );
}
