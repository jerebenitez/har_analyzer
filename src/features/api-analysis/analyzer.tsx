"use client"

import { useState, useMemo } from "react"
import { Search, Code, Key, Globe, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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

interface ApiEndpoint {
  path: string
  method: string
  domain: string
  fullUrl: string
  requests: number[]
  parameters: Set<string>
  headers: Map<string, Set<string>>
  authHeaders: string[]
  responseTypes: Set<string>
  statusCodes: Set<number>
  avgResponseTime: number
  dataPatterns: string[]
}

interface AuthPattern {
  type: string
  header: string
  pattern: string
  requests: number[]
  description: string
}

interface ApiAnalyzerProps {
  entries: HarEntry[]
}

export function ApiAnalyzer({ entries }: ApiAnalyzerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [domainFilter, setDomainFilter] = useState<string>("all")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("endpoints")

  // Analyze API patterns
  const apiAnalysis = useMemo(() => {
    const endpointMap = new Map<string, ApiEndpoint>()
    const authPatterns: AuthPattern[] = []
    const domains = new Set<string>()
    const methods = new Set<string>()

    entries.forEach((entry, index) => {
      const url = new URL(entry.request.url)
      const domain = url.hostname
      const path = normalizeApiPath(url.pathname)
      const method = entry.request.method
      const key = `${method}:${domain}${path}`

      domains.add(domain)
      methods.add(method)

      // Track endpoint
      if (!endpointMap.has(key)) {
        endpointMap.set(key, {
          path,
          method,
          domain,
          fullUrl: entry.request.url,
          requests: [index],
          parameters: new Set(),
          headers: new Map(),
          authHeaders: [],
          responseTypes: new Set(),
          statusCodes: new Set(),
          avgResponseTime: entry.time,
          dataPatterns: [],
        })
      } else {
        const endpoint = endpointMap.get(key)!
        endpoint.requests.push(index)
        endpoint.avgResponseTime = (endpoint.avgResponseTime + entry.time) / 2
      }

      const endpoint = endpointMap.get(key)!

      // Analyze parameters
      entry.request.queryString.forEach((param) => {
        endpoint.parameters.add(param.name)
      })

      // Analyze headers
      entry.request.headers.forEach((header) => {
        const headerName = header.name.toLowerCase()
        if (!endpoint.headers.has(headerName)) {
          endpoint.headers.set(headerName, new Set())
        }
        endpoint.headers.get(headerName)!.add(header.value)

        // Detect auth headers
        if (isAuthHeader(headerName, header.value)) {
          if (!endpoint.authHeaders.includes(headerName)) {
            endpoint.authHeaders.push(headerName)
          }
        }
      })

      // Analyze response
      endpoint.responseTypes.add(entry.response.content.mimeType)
      endpoint.statusCodes.add(entry.response.status)

      // Analyze data patterns
      if (entry.request.postData) {
        const pattern = analyzeDataPattern(entry.request.postData.text, entry.request.postData.mimeType)
        if (pattern && !endpoint.dataPatterns.includes(pattern)) {
          endpoint.dataPatterns.push(pattern)
        }
      }
    })

    // Detect authentication patterns
    const authHeadersFound = new Map<string, { pattern: string; requests: number[] }>()

    entries.forEach((entry, index) => {
      entry.request.headers.forEach((header) => {
        const headerName = header.name.toLowerCase()
        if (isAuthHeader(headerName, header.value)) {
          const pattern = getAuthPattern(header.value)
          const key = `${headerName}:${pattern}`

          if (!authHeadersFound.has(key)) {
            authHeadersFound.set(key, { pattern, requests: [index] })
          } else {
            authHeadersFound.get(key)!.requests.push(index)
          }
        }
      })
    })

    authHeadersFound.forEach((data, key) => {
      const [header, pattern] = key.split(":", 2)
      authPatterns.push({
        type: getAuthType(pattern),
        header,
        pattern,
        requests: data.requests,
        description: getAuthDescription(pattern),
      })
    })

    return {
      endpoints: Array.from(endpointMap.values()),
      authPatterns,
      domains: Array.from(domains).sort(),
      methods: Array.from(methods).sort(),
    }
  }, [entries])

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    return apiAnalysis.endpoints.filter((endpoint) => {
      const matchesSearch =
        endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.domain.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDomain = domainFilter === "all" || endpoint.domain === domainFilter
      const matchesMethod = methodFilter === "all" || endpoint.method === methodFilter

      return matchesSearch && matchesDomain && matchesMethod
    })
  }, [apiAnalysis.endpoints, searchTerm, domainFilter, methodFilter])

  // Group endpoints by domain
  const endpointsByDomain = useMemo(() => {
    const grouped = new Map<string, ApiEndpoint[]>()
    filteredEndpoints.forEach((endpoint) => {
      if (!grouped.has(endpoint.domain)) {
        grouped.set(endpoint.domain, [])
      }
      grouped.get(endpoint.domain)!.push(endpoint)
    })
    return grouped
  }, [filteredEndpoints])

  const formatTime = (time: number) => {
    if (time < 1000) return `${Math.round(time)}ms`
    return `${(time / 1000).toFixed(2)}s`
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
                  {apiAnalysis.endpoints.length}
                </p>
                <p className="text-xs text-muted-foreground">API Endpoints</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
                  {apiAnalysis.domains.length}
                </p>
                <p className="text-xs text-muted-foreground">API Domains</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
                  {apiAnalysis.authPatterns.length}
                </p>
                <p className="text-xs text-muted-foreground">Auth Patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
                  {Math.round(
                    apiAnalysis.endpoints.reduce((sum, ep) => sum + ep.avgResponseTime, 0) /
                      apiAnalysis.endpoints.length || 0,
                  )}
                  ms
                </p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-space-grotesk)]">API Analysis</CardTitle>
          <CardDescription>Reverse engineer API patterns and authentication mechanisms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search endpoints by path or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {apiAnalysis.domains
                    .filter((domain) => domain && domain.trim() !== "")
                    .map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {apiAnalysis.methods
                    .filter((method) => method && method.trim() !== "")
                    .map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="patterns">Data Patterns</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          {Array.from(endpointsByDomain.entries()).map(([domain, endpoints]) => (
            <Card key={domain}>
              <CardHeader>
                <CardTitle className="text-lg font-[family-name:var(--font-space-grotesk)]">{domain}</CardTitle>
                <CardDescription>{endpoints.length} endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {endpoints.map((endpoint, index) => (
                    <EndpointCard key={index} endpoint={endpoint} entries={entries} formatTime={formatTime} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <AuthenticationAnalysis authPatterns={apiAnalysis.authPatterns} entries={entries} />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <DataPatternsAnalysis endpoints={filteredEndpoints} />
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <ApiDocumentation endpoints={filteredEndpoints} authPatterns={apiAnalysis.authPatterns} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EndpointCard({
  endpoint,
  entries,
  formatTime,
}: {
  endpoint: ApiEndpoint
  entries: HarEntry[]
  formatTime: (time: number) => string
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-l-4 border-l-primary/20">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Badge className={`${getMethodColor(endpoint.method)} border`}>{endpoint.method}</Badge>
                <div className="font-mono text-sm">{endpoint.path}</div>
                {endpoint.authHeaders.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Key className="h-3 w-3 mr-1" />
                    Auth
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div>{endpoint.requests.length} requests</div>
                <div>{formatTime(endpoint.avgResponseTime)}</div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Parameters</h4>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(endpoint.parameters).map((param) => (
                      <Badge key={param} variant="outline" className="text-xs">
                        {param}
                      </Badge>
                    ))}
                    {endpoint.parameters.size === 0 && (
                      <span className="text-xs text-muted-foreground">No parameters</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Response Types</h4>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(endpoint.responseTypes).map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Status Codes</h4>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(endpoint.statusCodes).map((status) => (
                      <Badge key={status} variant="outline" className="text-xs">
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Auth Headers</h4>
                  <div className="flex flex-wrap gap-1">
                    {endpoint.authHeaders.map((header) => (
                      <Badge key={header} className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                        {header}
                      </Badge>
                    ))}
                    {endpoint.authHeaders.length === 0 && (
                      <span className="text-xs text-muted-foreground">No auth headers</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function AuthenticationAnalysis({ authPatterns, entries }: { authPatterns: AuthPattern[]; entries: HarEntry[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-space-grotesk)]">Authentication Patterns</CardTitle>
          <CardDescription>Detected authentication mechanisms and tokens</CardDescription>
        </CardHeader>
        <CardContent>
          {authPatterns.length === 0 ? (
            <p className="text-muted-foreground">No authentication patterns detected</p>
          ) : (
            <div className="space-y-4">
              {authPatterns.map((pattern, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">{pattern.type}</Badge>
                    <span className="font-mono text-sm">{pattern.header}</span>
                    <span className="text-xs text-muted-foreground">Used in {pattern.requests.length} requests</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                  <div className="font-mono text-xs bg-muted p-2 rounded break-all">{pattern.pattern}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DataPatternsAnalysis({ endpoints }: { endpoints: ApiEndpoint[] }) {
  const allPatterns = useMemo(() => {
    const patterns = new Map<string, { count: number; endpoints: string[] }>()
    endpoints.forEach((endpoint) => {
      endpoint.dataPatterns.forEach((pattern) => {
        if (!patterns.has(pattern)) {
          patterns.set(pattern, { count: 0, endpoints: [] })
        }
        patterns.get(pattern)!.count++
        patterns.get(pattern)!.endpoints.push(`${endpoint.method} ${endpoint.path}`)
      })
    })
    return Array.from(patterns.entries()).sort((a, b) => b[1].count - a[1].count)
  }, [endpoints])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-space-grotesk)]">Data Patterns</CardTitle>
        <CardDescription>Common data structures and formats</CardDescription>
      </CardHeader>
      <CardContent>
        {allPatterns.length === 0 ? (
          <p className="text-muted-foreground">No data patterns detected</p>
        ) : (
          <div className="space-y-4">
            {allPatterns.map(([pattern, data], index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline">{pattern}</Badge>
                  <span className="text-xs text-muted-foreground">Used {data.count} times</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Endpoints: {data.endpoints.slice(0, 3).join(", ")}
                  {data.endpoints.length > 3 && ` and ${data.endpoints.length - 3} more`}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ApiDocumentation({ endpoints, authPatterns }: { endpoints: ApiEndpoint[]; authPatterns: AuthPattern[] }) {
  const generateCurlCommand = (endpoint: ApiEndpoint) => {
    let curl = `curl -X ${endpoint.method} "${endpoint.fullUrl}"`

    // Add auth headers
    endpoint.authHeaders.forEach((header) => {
      const authPattern = authPatterns.find((p) => p.header === header)
      if (authPattern) {
        curl += ` \\\n  -H "${header}: ${authPattern.pattern}"`
      }
    })

    // Add common headers
    curl += ` \\\n  -H "Content-Type: application/json"`

    return curl
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-space-grotesk)]">API Documentation</CardTitle>
          <CardDescription>Generated documentation and example requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={`${getMethodColor(endpoint.method)} border`}>{endpoint.method}</Badge>
                  <span className="font-mono text-sm">{endpoint.path}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Parameters</h4>
                    {endpoint.parameters.size > 0 ? (
                      <div className="text-xs font-mono bg-muted p-2 rounded">
                        {Array.from(endpoint.parameters)
                          .map((param) => `${param}: string`)
                          .join("\n")}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No parameters</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-1">Example cURL</h4>
                    <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto">
                      {generateCurlCommand(endpoint)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions
function normalizeApiPath(path: string): string {
  // Replace IDs and UUIDs with placeholders
  return path
    .replace(/\/\d+/g, "/{id}")
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/{uuid}")
    .replace(/\/[0-9a-f]{24}/gi, "/{objectId}")
}

function isAuthHeader(headerName: string, headerValue: string): boolean {
  const authHeaders = ["authorization", "x-api-key", "x-auth-token", "x-access-token", "cookie"]
  if (authHeaders.includes(headerName)) return true

  // Check for JWT patterns
  if (headerValue.match(/^Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)) return true

  // Check for API key patterns
  if (headerValue.match(/^[A-Za-z0-9]{20,}$/)) return true

  return false
}

function getAuthPattern(headerValue: string): string {
  if (headerValue.startsWith("Bearer ")) {
    const token = headerValue.substring(7)
    if (token.includes(".")) return "Bearer JWT_TOKEN"
    return "Bearer API_TOKEN"
  }
  if (headerValue.match(/^[A-Za-z0-9]{20,}$/)) return "API_KEY"
  if (headerValue.includes("=")) return "COOKIE_AUTH"
  return "CUSTOM_AUTH"
}

function getAuthType(pattern: string): string {
  if (pattern.includes("JWT")) return "JWT"
  if (pattern.includes("Bearer")) return "Bearer Token"
  if (pattern.includes("API_KEY")) return "API Key"
  if (pattern.includes("COOKIE")) return "Cookie Auth"
  return "Custom"
}

function getAuthDescription(pattern: string): string {
  if (pattern.includes("JWT")) return "JSON Web Token authentication"
  if (pattern.includes("Bearer")) return "Bearer token authentication"
  if (pattern.includes("API_KEY")) return "API key authentication"
  if (pattern.includes("COOKIE")) return "Cookie-based authentication"
  return "Custom authentication mechanism"
}

function analyzeDataPattern(data: string, mimeType: string): string | null {
  try {
    if (mimeType.includes("json")) {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) return "JSON Array"
      if (typeof parsed === "object") return "JSON Object"
    }
    if (mimeType.includes("form")) return "Form Data"
    if (mimeType.includes("xml")) return "XML"
    return null
  } catch {
    return null
  }
}

function getMethodColor(method: string): string {
  switch (method.toLowerCase()) {
    case "get":
      return "bg-blue-100 text-blue-800"
    case "post":
      return "bg-green-100 text-green-800"
    case "put":
      return "bg-yellow-100 text-yellow-800"
    case "delete":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

