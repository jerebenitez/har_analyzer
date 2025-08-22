"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowDown, ArrowRight, Clock, Key, Cookie, Database } from "lucide-react"

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

interface ParameterSource {
  name: string
  value: string
  source: "hardcoded" | "cookie" | "response" | "header" | "unknown"
  sourceRequest?: number
  sourceField?: string
}

interface RequestDependency {
  requestIndex: number
  entry: HarEntry
  dependencies: number[]
  parameterSources: ParameterSource[]
  cookieSources: ParameterSource[]
  headerSources: ParameterSource[]
}

interface RequestFlowAnalyzerProps {
  entries: HarEntry[]
  selectedRequestIndex?: number
  onRequestSelect?: (index: number) => void
}

export function RequestFlowAnalyzer({ entries, selectedRequestIndex, onRequestSelect }: RequestFlowAnalyzerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["flow"]))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const analysisData = useMemo(() => {
    if (selectedRequestIndex === undefined) return null

    const selectedEntry = entries[selectedRequestIndex]
    const dependencies: number[] = []
    const parameterSources: ParameterSource[] = []
    const cookieSources: ParameterSource[] = []
    const headerSources: ParameterSource[] = []

    // Analyze parameters from query string and POST data
    const analyzeParameters = () => {
      // Query parameters
      selectedEntry.request.queryString.forEach((param) => {
        const source = findParameterSource(param.name, param.value, selectedRequestIndex)
        parameterSources.push(source)
        if (source.sourceRequest !== undefined && !dependencies.includes(source.sourceRequest)) {
          dependencies.push(source.sourceRequest)
        }
      })

      // POST data parameters
      if (selectedEntry.request.postData?.text) {
        try {
          const postData = selectedEntry.request.postData.text
          if (selectedEntry.request.postData.mimeType.includes("application/x-www-form-urlencoded")) {
            const params = new URLSearchParams(postData)
            params.forEach((value, name) => {
              const source = findParameterSource(name, value, selectedRequestIndex)
              parameterSources.push(source)
              if (source.sourceRequest !== undefined && !dependencies.includes(source.sourceRequest)) {
                dependencies.push(source.sourceRequest)
              }
            })
          } else if (selectedEntry.request.postData.mimeType.includes("application/json")) {
            const jsonData = JSON.parse(postData)
            Object.entries(jsonData).forEach(([name, value]) => {
              const source = findParameterSource(name, String(value), selectedRequestIndex)
              parameterSources.push(source)
              if (source.sourceRequest !== undefined && !dependencies.includes(source.sourceRequest)) {
                dependencies.push(source.sourceRequest)
              }
            })
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }

    // Analyze cookies
    const analyzeCookies = () => {
      selectedEntry.request.cookies.forEach((cookie) => {
        const source = findCookieSource(cookie.name, cookie.value, selectedRequestIndex)
        cookieSources.push(source)
        if (source.sourceRequest !== undefined && !dependencies.includes(source.sourceRequest)) {
          dependencies.push(source.sourceRequest)
        }
      })
    }

    // Analyze headers
    const analyzeHeaders = () => {
      selectedEntry.request.headers.forEach((header) => {
        if (
          header.name.toLowerCase() === "authorization" ||
          header.name.toLowerCase() === "x-csrf-token" ||
          header.name.toLowerCase().includes("token")
        ) {
          const source = findHeaderSource(header.name, header.value, selectedRequestIndex)
          headerSources.push(source)
          if (source.sourceRequest !== undefined && !dependencies.includes(source.sourceRequest)) {
            dependencies.push(source.sourceRequest)
          }
        }
      })
    }

    const findParameterSource = (name: string, value: string, currentIndex: number): ParameterSource => {
      // Check if it's a hardcoded value (common patterns)
      if (isHardcodedValue(value)) {
        return { name, value, source: "hardcoded" }
      }

      // Look for the value in previous responses
      for (let i = currentIndex - 1; i >= 0; i--) {
        const entry = entries[i]

        // Check response content
        if (entry.response.content.text) {
          try {
            const responseText = entry.response.content.text
            if (responseText.includes(value)) {
              return {
                name,
                value,
                source: "response",
                sourceRequest: i,
                sourceField: "response_body",
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }

        // Check response headers
        const headerMatch = entry.response.headers.find((h) => h.value === value)
        if (headerMatch) {
          return {
            name,
            value,
            source: "header",
            sourceRequest: i,
            sourceField: headerMatch.name,
          }
        }

        // Check set cookies
        const cookieMatch = entry.response.cookies.find((c) => c.value === value)
        if (cookieMatch) {
          return {
            name,
            value,
            source: "cookie",
            sourceRequest: i,
            sourceField: cookieMatch.name,
          }
        }
      }

      return { name, value, source: "unknown" }
    }

    const findCookieSource = (name: string, value: string, currentIndex: number): ParameterSource => {
      // Look for when this cookie was set
      for (let i = currentIndex - 1; i >= 0; i--) {
        const entry = entries[i]
        const setCookie = entry.response.cookies.find((c) => c.name === name)
        if (setCookie) {
          return {
            name,
            value,
            source: "cookie",
            sourceRequest: i,
            sourceField: "Set-Cookie",
          }
        }
      }

      return { name, value, source: "unknown" }
    }

    const findHeaderSource = (name: string, value: string, currentIndex: number): ParameterSource => {
      // Look for the value in previous responses
      for (let i = currentIndex - 1; i >= 0; i--) {
        const entry = entries[i]

        // Check response content for tokens
        if (entry.response.content.text) {
          try {
            const responseText = entry.response.content.text
            if (responseText.includes(value.replace("Bearer ", ""))) {
              return {
                name,
                value,
                source: "response",
                sourceRequest: i,
                sourceField: "response_body",
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }

      return { name, value, source: "unknown" }
    }

    const isHardcodedValue = (value: string): boolean => {
      // Common patterns for hardcoded values
      const hardcodedPatterns = [
        /^(true|false)$/i,
        /^\d+$/,
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i, // UUID
        /^(GET|POST|PUT|DELETE|PATCH)$/i,
        /^(json|xml|html)$/i,
        /^(en|es|fr|de|it)$/i, // Language codes
      ]

      return hardcodedPatterns.some((pattern) => pattern.test(value)) || value.length < 3
    }

    analyzeParameters()
    analyzeCookies()
    analyzeHeaders()

    // Sort dependencies by request order
    dependencies.sort((a, b) => a - b)

    return {
      requestIndex: selectedRequestIndex,
      entry: selectedEntry,
      dependencies,
      parameterSources,
      cookieSources,
      headerSources,
    }
  }, [entries, selectedRequestIndex])

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "cookie":
        return <Cookie className="h-4 w-4" />
      case "response":
        return <Database className="h-4 w-4" />
      case "header":
        return <Key className="h-4 w-4" />
      default:
        return <ArrowRight className="h-4 w-4" />
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case "cookie":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "response":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "header":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "hardcoded":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  if (!analysisData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDown className="h-5 w-5" />
            Request Flow Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a request to analyze its dependencies and parameter sources.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selected Request Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDown className="h-5 w-5" />
            Request Flow Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{analysisData.entry.request.method}</Badge>
              <span className="font-mono text-sm">{analysisData.entry.request.url}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(analysisData.entry.startedDateTime).toLocaleTimeString()}
              </span>
              <span>Status: {analysisData.entry.response.status}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependency Flow */}
      {analysisData.dependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 cursor-pointer" onClick={() => toggleSection("flow")}>
              <ArrowRight
                className={`h-4 w-4 transition-transform ${expandedSections.has("flow") ? "rotate-90" : ""}`}
              />
              Request Flow ({analysisData.dependencies.length} dependencies)
            </CardTitle>
          </CardHeader>
          {expandedSections.has("flow") && (
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {analysisData.dependencies.map((depIndex, i) => {
                    const depEntry = entries[depIndex]
                    return (
                      <div key={depIndex} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                          {i + 1}
                        </div>
                        <ArrowDown className="h-4 w-4 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start h-auto p-2 text-left"
                          onClick={() => onRequestSelect?.(depIndex)}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {depEntry.request.method}
                              </Badge>
                              <span className="font-mono text-xs truncate max-w-md">{depEntry.request.url}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(depEntry.startedDateTime).toLocaleTimeString()} • Status:{" "}
                              {depEntry.response.status}
                            </div>
                          </div>
                        </Button>
                      </div>
                    )
                  })}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs">
                      ★
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="font-semibold">Selected Request</div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      )}

      {/* Parameter Sources */}
      {analysisData.parameterSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 cursor-pointer" onClick={() => toggleSection("parameters")}>
              <ArrowRight
                className={`h-4 w-4 transition-transform ${expandedSections.has("parameters") ? "rotate-90" : ""}`}
              />
              Parameter Sources ({analysisData.parameterSources.length})
            </CardTitle>
          </CardHeader>
          {expandedSections.has("parameters") && (
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {analysisData.parameterSources.map((param, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-mono text-sm font-semibold">{param.name}</div>
                        <div className="font-mono text-xs text-muted-foreground truncate max-w-xs">{param.value}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getSourceColor(param.source)}`}>
                          <div className="flex items-center gap-1">
                            {getSourceIcon(param.source)}
                            {param.source}
                          </div>
                        </Badge>
                        {param.sourceRequest !== undefined && (
                          <Button variant="ghost" size="sm" onClick={() => onRequestSelect?.(param.sourceRequest!)}>
                            Request #{param.sourceRequest + 1}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      )}

      {/* Cookie Sources */}
      {analysisData.cookieSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 cursor-pointer" onClick={() => toggleSection("cookies")}>
              <ArrowRight
                className={`h-4 w-4 transition-transform ${expandedSections.has("cookies") ? "rotate-90" : ""}`}
              />
              Cookie Sources ({analysisData.cookieSources.length})
            </CardTitle>
          </CardHeader>
          {expandedSections.has("cookies") && (
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {analysisData.cookieSources.map((cookie, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-mono text-sm font-semibold">{cookie.name}</div>
                        <div className="font-mono text-xs text-muted-foreground truncate max-w-xs">{cookie.value}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getSourceColor(cookie.source)}`}>
                          <div className="flex items-center gap-1">
                            {getSourceIcon(cookie.source)}
                            {cookie.source}
                          </div>
                        </Badge>
                        {cookie.sourceRequest !== undefined && (
                          <Button variant="ghost" size="sm" onClick={() => onRequestSelect?.(cookie.sourceRequest!)}>
                            Request #{cookie.sourceRequest + 1}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      )}

      {/* Header Sources */}
      {analysisData.headerSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 cursor-pointer" onClick={() => toggleSection("headers")}>
              <ArrowRight
                className={`h-4 w-4 transition-transform ${expandedSections.has("headers") ? "rotate-90" : ""}`}
              />
              Header Sources ({analysisData.headerSources.length})
            </CardTitle>
          </CardHeader>
          {expandedSections.has("headers") && (
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {analysisData.headerSources.map((header, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-mono text-sm font-semibold">{header.name}</div>
                        <div className="font-mono text-xs text-muted-foreground truncate max-w-xs">{header.value}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getSourceColor(header.source)}`}>
                          <div className="flex items-center gap-1">
                            {getSourceIcon(header.source)}
                            {header.source}
                          </div>
                        </Badge>
                        {header.sourceRequest !== undefined && (
                          <Button variant="ghost" size="sm" onClick={() => onRequestSelect?.(header.sourceRequest!)}>
                            Request #{header.sourceRequest + 1}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
