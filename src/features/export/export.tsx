"use client"

import { useState, useMemo } from "react"
import { Download, Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface HarEntry {
  request: {
    method: string
    url: string
    headers: Array<{ name: string; value: string }>
    cookies: Array<{ name: string; value: string }>
    queryString: Array<{ name: string; value: string }>
    postData?: {
      mimeType: string
      text: string
    }
  }
  response: {
    status: number
    statusText: string
    headers: Array<{ name: string; value: string }>
    cookies: Array<{ name: string; value: string }>
    content: {
      size: number
      mimeType: string
      text?: string
    }
  }
  startedDateTime: string
  time: number
}

interface ExportToolsProps {
  entries: HarEntry[]
}

export function ExportTools({ entries }: ExportToolsProps) {
  const [selectedFormat, setSelectedFormat] = useState("python")
  const [selectedEntries, setSelectedEntries] = useState<number[]>([])
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [includeCookies, setIncludeCookies] = useState(true)
  const [includeAuth, setIncludeAuth] = useState(true)
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  // Filter entries for export
  const exportEntries = useMemo(() => {
    if (selectedEntries.length === 0) return entries
    return entries.filter((_, index) => selectedEntries.includes(index))
  }, [entries, selectedEntries])

  // Generate different export formats
  const exportData = useMemo(() => {
    return {
      python: generatePythonScript(exportEntries, { includeHeaders, includeCookies, includeAuth }),
      javascript: generateJavaScriptScript(exportEntries, { includeHeaders, includeCookies, includeAuth }),
      curl: generateCurlCommands(exportEntries, { includeHeaders, includeCookies, includeAuth }),
      postman: generatePostmanCollection(exportEntries, { includeHeaders, includeCookies, includeAuth }),
      json: generateJsonExport(exportEntries),
      csv: generateCsvExport(exportEntries),
      documentation: generateApiDocumentation(exportEntries),
    }
  }, [exportEntries, includeHeaders, includeCookies, includeAuth])

  const handleCopy = async (content: string, key: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedStates({ ...copiedStates, [key]: true })
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [key]: false })
      }, 2000)
    } catch (err) {
      console.error("[v0] Failed to copy to clipboard:", err)
    }
  }

  const handleDownload = (content: string, filename: string, mimeType = "text/plain") => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleEntrySelection = (index: number) => {
    setSelectedEntries((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const selectAllEntries = () => {
    setSelectedEntries(entries.map((_, index) => index))
  }

  const clearSelection = () => {
    setSelectedEntries([])
  }

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-space-grotesk)]">Export Options</CardTitle>
          <CardDescription>Configure what to include in your exports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="headers" checked={includeHeaders} onCheckedChange={setIncludeHeaders} />
                <label htmlFor="headers" className="text-sm font-medium">
                  Include Headers
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cookies" checked={includeCookies} onCheckedChange={setIncludeCookies} />
                <label htmlFor="cookies" className="text-sm font-medium">
                  Include Cookies
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="auth" checked={includeAuth} onCheckedChange={setIncludeAuth} />
                <label htmlFor="auth" className="text-sm font-medium">
                  Include Authentication
                </label>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Request Selection</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllEntries}>
                    Select All ({entries.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedEntries.length === 0
                    ? `All ${entries.length} requests will be exported`
                    : `${selectedEntries.length} requests selected`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-space-grotesk)]">Select Requests</CardTitle>
          <CardDescription>Choose specific requests to include in exports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-auto space-y-2">
            {entries.map((entry, index) => {
              const url = new URL(entry.request.url)
              return (
                <div key={index} className="flex items-center space-x-3 p-2 border rounded">
                  <Checkbox
                    checked={selectedEntries.includes(index)}
                    onCheckedChange={() => toggleEntrySelection(index)}
                  />
                  <Badge className={getMethodColor(entry.request.method)}>{entry.request.method}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono truncate">{url.pathname}</div>
                    <div className="text-xs text-muted-foreground">{url.hostname}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {entry.response.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Export Formats */}
      <Tabs value={selectedFormat} onValueChange={setSelectedFormat}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
          <TabsTrigger value="curl">cURL</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="python" className="space-y-4">
          <ExportCard
            title="Python Requests Script"
            description="Generate Python script using the requests library"
            content={exportData.python}
            filename="har_scraper.py"
            onCopy={() => handleCopy(exportData.python, "python")}
            onDownload={() => handleDownload(exportData.python, "har_scraper.py", "text/x-python")}
            copied={copiedStates.python}
          />
        </TabsContent>

        <TabsContent value="javascript" className="space-y-4">
          <ExportCard
            title="JavaScript Fetch Script"
            description="Generate JavaScript script using fetch API"
            content={exportData.javascript}
            filename="har_scraper.js"
            onCopy={() => handleCopy(exportData.javascript, "javascript")}
            onDownload={() => handleDownload(exportData.javascript, "har_scraper.js", "text/javascript")}
            copied={copiedStates.javascript}
          />
        </TabsContent>

        <TabsContent value="curl" className="space-y-4">
          <ExportCard
            title="cURL Commands"
            description="Generate cURL commands for each request"
            content={exportData.curl}
            filename="har_commands.sh"
            onCopy={() => handleCopy(exportData.curl, "curl")}
            onDownload={() => handleDownload(exportData.curl, "har_commands.sh", "text/x-shellscript")}
            copied={copiedStates.curl}
          />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ExportCard
              title="JSON Export"
              description="Export request data as JSON"
              content={exportData.json}
              filename="har_data.json"
              onCopy={() => handleCopy(exportData.json, "json")}
              onDownload={() => handleDownload(exportData.json, "har_data.json", "application/json")}
              copied={copiedStates.json}
            />
            <ExportCard
              title="CSV Export"
              description="Export request data as CSV"
              content={exportData.csv}
              filename="har_data.csv"
              onCopy={() => handleCopy(exportData.csv, "csv")}
              onDownload={() => handleDownload(exportData.csv, "har_data.csv", "text/csv")}
              copied={copiedStates.csv}
            />
          </div>
          <ExportCard
            title="Postman Collection"
            description="Import into Postman for API testing"
            content={exportData.postman}
            filename="har_collection.json"
            onCopy={() => handleCopy(exportData.postman, "postman")}
            onDownload={() => handleDownload(exportData.postman, "har_collection.json", "application/json")}
            copied={copiedStates.postman}
          />
          <ExportCard
            title="API Documentation"
            description="Generated API documentation"
            content={exportData.documentation}
            filename="api_documentation.md"
            onCopy={() => handleCopy(exportData.documentation, "documentation")}
            onDownload={() => handleDownload(exportData.documentation, "api_documentation.md", "text/markdown")}
            copied={copiedStates.documentation}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ExportCard({
  title,
  description,
  content,
  filename,
  onCopy,
  onDownload,
  copied,
}: {
  title: string
  description: string
  content: string
  filename: string
  onCopy: () => void
  onDownload: () => void
  copied?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-[family-name:var(--font-space-grotesk)]">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          readOnly
          className="font-mono text-xs min-h-64 resize-none"
          placeholder="Generated code will appear here..."
        />
      </CardContent>
    </Card>
  )
}

// Export generation functions
function generatePythonScript(
  entries: HarEntry[],
  options: { includeHeaders: boolean; includeCookies: boolean; includeAuth: boolean },
): string {
  const script = `#!/usr/bin/env python3
"""
HAR File Scraper - Generated from HAR analysis
This script replicates the HTTP requests found in your HAR file.
"""

import requests
import json
from urllib.parse import urljoin

class HarScraper:
    def __init__(self):
        self.session = requests.Session()
        ${options.includeCookies ? "self.setup_cookies()" : ""}
        ${options.includeHeaders ? "self.setup_headers()" : ""}
    
    ${options.includeCookies ? generatePythonCookieSetup(entries) : ""}
    ${options.includeHeaders ? generatePythonHeaderSetup(entries) : ""}
    
    def scrape_all(self):
        """Execute all requests in sequence"""
        results = []
        
${entries.map((entry, index) => generatePythonRequest(entry, index, options)).join("\n\n")}
        
        return results

if __name__ == "__main__":
    scraper = HarScraper()
    results = scraper.scrape_all()
    
    # Save results
    with open("scraper_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"Completed {len(results)} requests. Results saved to scraper_results.json")
`

  return script
}

function generateJavaScriptScript(
  entries: HarEntry[],
  options: { includeHeaders: boolean; includeCookies: boolean; includeAuth: boolean },
): string {
  const script = `/**
 * HAR File Scraper - Generated from HAR analysis
 * This script replicates the HTTP requests found in your HAR file.
 */

class HarScraper {
    constructor() {
        ${options.includeHeaders ? "this.setupHeaders();" : ""}
        ${options.includeCookies ? "this.setupCookies();" : ""}
    }
    
    ${options.includeHeaders ? generateJavaScriptHeaderSetup(entries) : ""}
    ${options.includeCookies ? generateJavaScriptCookieSetup(entries) : ""}
    
    async scrapeAll() {
        const results = [];
        
${entries.map((entry, index) => generateJavaScriptRequest(entry, index, options)).join("\n\n")}
        
        return results;
    }
}

// Usage
const scraper = new HarScraper();
scraper.scrapeAll()
    .then(results => {
        console.log(\`Completed \${results.length} requests\`);
        console.log(JSON.stringify(results, null, 2));
    })
    .catch(error => {
        console.error('Scraping failed:', error);
    });
`

  return script
}

function generateCurlCommands(
  entries: HarEntry[],
  options: { includeHeaders: boolean; includeCookies: boolean; includeAuth: boolean },
): string {
  return entries
    .map((entry, index) => {
      let curl = `# Request ${index + 1}: ${entry.request.method} ${entry.request.url}\n`
      curl += `curl -X ${entry.request.method} "${entry.request.url}"`

      if (options.includeHeaders) {
        entry.request.headers.forEach((header) => {
          if (header.name.toLowerCase() !== "cookie" || options.includeCookies) {
            if (!options.includeAuth && isAuthHeader(header.name.toLowerCase())) return
            curl += ` \\\n  -H "${header.name}: ${header.value}"`
          }
        })
      }

      if (entry.request.postData) {
        curl += ` \\\n  -d '${entry.request.postData.text}'`
      }

      return curl
    })
    .join("\n\n")
}

function generatePostmanCollection(
  entries: HarEntry[],
  options: { includeHeaders: boolean; includeCookies: boolean; includeAuth: boolean },
): string {
  const collection = {
    info: {
      name: "HAR Import Collection",
      description: "Generated from HAR file analysis",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: entries.map((entry, index) => {
      const url = new URL(entry.request.url)
      const headers = options.includeHeaders
        ? entry.request.headers
            .filter((h) => {
              if (!options.includeCookies && h.name.toLowerCase() === "cookie") return false
              if (!options.includeAuth && isAuthHeader(h.name.toLowerCase())) return false
              return true
            })
            .map((h) => ({ key: h.name, value: h.value }))
        : []

      return {
        name: `${entry.request.method} ${url.pathname}`,
        request: {
          method: entry.request.method,
          header: headers,
          url: {
            raw: entry.request.url,
            protocol: url.protocol.slice(0, -1),
            host: url.hostname.split("."),
            port: url.port || (url.protocol === "https:" ? "443" : "80"),
            path: url.pathname.split("/").filter(Boolean),
            query: entry.request.queryString.map((q) => ({ key: q.name, value: q.value })),
          },
          body: entry.request.postData
            ? {
                mode: "raw",
                raw: entry.request.postData.text,
                options: {
                  raw: {
                    language: entry.request.postData.mimeType.includes("json") ? "json" : "text",
                  },
                },
              }
            : undefined,
        },
      }
    }),
  }

  return JSON.stringify(collection, null, 2)
}

function generateJsonExport(entries: HarEntry[]): string {
  const exportData = entries.map((entry, index) => ({
    index,
    method: entry.request.method,
    url: entry.request.url,
    status: entry.response.status,
    headers: Object.fromEntries(entry.request.headers.map((h) => [h.name, h.value])),
    cookies: Object.fromEntries(entry.request.cookies.map((c) => [c.name, c.value])),
    queryParams: Object.fromEntries(entry.request.queryString.map((q) => [q.name, q.value])),
    requestBody: entry.request.postData?.text,
    responseSize: entry.response.content.size,
    responseTime: entry.time,
    timestamp: entry.startedDateTime,
  }))

  return JSON.stringify(exportData, null, 2)
}

function generateCsvExport(entries: HarEntry[]): string {
  const headers = [
    "Index",
    "Method",
    "URL",
    "Domain",
    "Path",
    "Status",
    "Response Time (ms)",
    "Response Size (bytes)",
    "Content Type",
    "Timestamp",
  ]

  const rows = entries.map((entry, index) => {
    const url = new URL(entry.request.url)
    return [
      index,
      entry.request.method,
      entry.request.url,
      url.hostname,
      url.pathname,
      entry.response.status,
      Math.round(entry.time),
      entry.response.content.size,
      entry.response.content.mimeType,
      entry.startedDateTime,
    ]
  })

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

function generateApiDocumentation(entries: HarEntry[]): string {
  const domains = new Map<string, HarEntry[]>()
  entries.forEach((entry) => {
    const domain = new URL(entry.request.url).hostname
    if (!domains.has(domain)) domains.set(domain, [])
    domains.get(domain)!.push(entry)
  })

  let doc = `# API Documentation\n\nGenerated from HAR file analysis\n\n`

  domains.forEach((domainEntries, domain) => {
    doc += `## ${domain}\n\n`

    const endpoints = new Map<string, HarEntry[]>()
    domainEntries.forEach((entry) => {
      const url = new URL(entry.request.url)
      const key = `${entry.request.method} ${url.pathname}`
      if (!endpoints.has(key)) endpoints.set(key, [])
      endpoints.get(key)!.push(entry)
    })

    endpoints.forEach((endpointEntries, endpoint) => {
      const [method, path] = endpoint.split(" ", 2)
      doc += `### ${method} ${path}\n\n`

      const firstEntry = endpointEntries[0]
      doc += `**URL:** \`${firstEntry.request.url}\`\n\n`

      if (firstEntry.request.queryString.length > 0) {
        doc += `**Query Parameters:**\n`
        firstEntry.request.queryString.forEach((param) => {
          doc += `- \`${param.name}\`: ${param.value}\n`
        })
        doc += `\n`
      }

      if (firstEntry.request.headers.length > 0) {
        doc += `**Headers:**\n`
        firstEntry.request.headers.forEach((header) => {
          doc += `- \`${header.name}\`: ${header.value}\n`
        })
        doc += `\n`
      }

      if (firstEntry.request.postData) {
        doc += `**Request Body:**\n\`\`\`\n${firstEntry.request.postData.text}\n\`\`\`\n\n`
      }

      doc += `**Response Status:** ${firstEntry.response.status}\n\n`
      doc += `**Response Time:** ${Math.round(firstEntry.time)}ms\n\n`
      doc += `---\n\n`
    })
  })

  return doc
}

// Helper functions for script generation
function generatePythonRequest(
  entry: HarEntry,
  index: number,
  options: { includeHeaders: boolean; includeCookies: boolean; includeAuth: boolean },
): string {
  const url = new URL(entry.request.url)
  let request = `        # Request ${index + 1}: ${entry.request.method} ${url.pathname}\n`
  request += `        try:\n`
  request += `            response = self.session.${entry.request.method.toLowerCase()}(\n`
  request += `                "${entry.request.url}"`

  if (entry.request.postData) {
    request += `,\n                data='${entry.request.postData.text}'`
  }

  request += `\n            )\n`
  request += `            results.append({\n`
  request += `                "index": ${index},\n`
  request += `                "method": "${entry.request.method}",\n`
  request += `                "url": "${entry.request.url}",\n`
  request += `                "status": response.status_code,\n`
  request += `                "response": response.text[:1000]  # First 1000 chars\n`
  request += `            })\n`
  request += `            print(f"✓ Request ${index + 1}: {response.status_code}")\n`
  request += `        except Exception as e:\n`
  request += `            print(f"✗ Request ${index + 1} failed: {e}")\n`
  request += `            results.append({"index": ${index}, "error": str(e)})`

  return request
}

function generateJavaScriptRequest(
  entry: HarEntry,
  index: number,
  options: { includeHeaders: boolean; includeCookies: boolean; includeAuth: boolean },
): string {
  let request = `        // Request ${index + 1}: ${entry.request.method} ${new URL(entry.request.url).pathname}\n`
  request += `        try {\n`
  request += `            const response${index} = await fetch("${entry.request.url}", {\n`
  request += `                method: "${entry.request.method}"`

  if (options.includeHeaders) {
    request += `,\n                headers: this.headers`
  }

  if (entry.request.postData) {
    request += `,\n                body: '${entry.request.postData.text}'`
  }

  request += `\n            });\n`
  request += `            const data${index} = await response${index}.text();\n`
  request += `            results.push({\n`
  request += `                index: ${index},\n`
  request += `                method: "${entry.request.method}",\n`
  request += `                url: "${entry.request.url}",\n`
  request += `                status: response${index}.status,\n`
  request += `                response: data${index}.substring(0, 1000)\n`
  request += `            });\n`
  request += `            console.log(\`✓ Request ${index + 1}: \${response${index}.status}\`);\n`
  request += `        } catch (error) {\n`
  request += `            console.error(\`✗ Request ${index + 1} failed:\`, error);\n`
  request += `            results.push({ index: ${index}, error: error.message });\n`
  request += `        }`

  return request
}

function generatePythonCookieSetup(entries: HarEntry[]): string {
  const cookies = new Map<string, string>()
  entries.forEach((entry) => {
    entry.request.cookies.forEach((cookie) => {
      cookies.set(cookie.name, cookie.value)
    })
  })

  if (cookies.size === 0) return ""

  let setup = `    def setup_cookies(self):\n        """Setup session cookies"""\n`
  cookies.forEach((value, name) => {
    setup += `        self.session.cookies.set("${name}", "${value}")\n`
  })

  return setup
}

function generatePythonHeaderSetup(entries: HarEntry[]): string {
  const commonHeaders = new Map<string, string>()
  entries.forEach((entry) => {
    entry.request.headers.forEach((header) => {
      if (header.name.toLowerCase() !== "cookie") {
        commonHeaders.set(header.name, header.value)
      }
    })
  })

  if (commonHeaders.size === 0) return ""

  let setup = `    def setup_headers(self):\n        """Setup common headers"""\n        headers = {\n`
  commonHeaders.forEach((value, name) => {
    setup += `            "${name}": "${value}",\n`
  })
  setup += `        }\n        self.session.headers.update(headers)\n`

  return setup
}

function generateJavaScriptHeaderSetup(entries: HarEntry[]): string {
  const commonHeaders = new Map<string, string>()
  entries.forEach((entry) => {
    entry.request.headers.forEach((header) => {
      if (header.name.toLowerCase() !== "cookie") {
        commonHeaders.set(header.name, header.value)
      }
    })
  })

  if (commonHeaders.size === 0) return ""

  let setup = `    setupHeaders() {\n        this.headers = {\n`
  commonHeaders.forEach((value, name) => {
    setup += `            "${name}": "${value}",\n`
  })
  setup += `        };\n    }\n`

  return setup
}

function generateJavaScriptCookieSetup(entries: HarEntry[]): string {
  // Note: Cookies in browser fetch are handled automatically
  return `    setupCookies() {\n        // Cookies are handled automatically by the browser\n        // For Node.js, you would need to use a cookie jar\n    }\n`
}

function getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "POST":
      return "bg-green-100 text-green-800 border-green-200"
    case "PUT":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "DELETE":
      return "bg-red-100 text-red-800 border-red-200"
    case "PATCH":
      return "bg-purple-100 text-purple-800 border-purple-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

function isAuthHeader(headerName: string): boolean {
  const authHeaders = ["authorization", "x-api-key", "x-auth-token", "x-access-token"]
  return authHeaders.includes(headerName.toLowerCase())
}
