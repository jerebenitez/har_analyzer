"use client"

import { useState, useMemo } from "react"
import { Search, Cookie, Shield, Globe, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

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

interface CookieInfo {
  name: string
  value: string
  domain?: string
  path?: string
  expires?: string
  maxAge?: number
  secure?: boolean
  httpOnly?: boolean
  sameSite?: string
  firstSeenAt: string
  firstSeenInRequest: number
  setByRequests: number[]
  usedInRequests: number[]
  currentValue: string
}

interface CookieTrackerProps {
  entries: HarEntry[]
}

export function CookieTracker({ entries }: CookieTrackerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [domainFilter, setDomainFilter] = useState<string>("all")
  const [showValues, setShowValues] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Analyze cookies across all requests
  const cookieAnalysis = useMemo(() => {
    const cookieMap = new Map<string, CookieInfo>()
    const domains = new Set<string>()

    entries.forEach((entry, requestIndex) => {
      const url = new URL(entry.request.url)
      const domain = url.hostname
      domains.add(domain)

      // Process request cookies (cookies being sent)
      entry.request.cookies.forEach((cookie) => {
        const key = `${cookie.name}@${domain}`
        if (!cookieMap.has(key)) {
          cookieMap.set(key, {
            name: cookie.name,
            value: cookie.value,
            domain,
            firstSeenAt: entry.startedDateTime,
            firstSeenInRequest: requestIndex,
            setByRequests: [],
            usedInRequests: [requestIndex],
            currentValue: cookie.value,
          })
        } else {
          const existing = cookieMap.get(key)!
          existing.usedInRequests.push(requestIndex)
          existing.currentValue = cookie.value
        }
      })

      // Process response cookies (cookies being set)
      const setCookieHeaders = entry.response.headers.filter((header) => header.name.toLowerCase() === "set-cookie")

      setCookieHeaders.forEach((header) => {
        const cookieData = parseCookieHeader(header.value)
        if (cookieData) {
          const cookieDomain = cookieData.domain || domain
          const key = `${cookieData.name}@${cookieDomain}`

          if (!cookieMap.has(key)) {
            cookieMap.set(key, {
              ...cookieData,
              domain: cookieDomain,
              firstSeenAt: entry.startedDateTime,
              firstSeenInRequest: requestIndex,
              setByRequests: [requestIndex],
              usedInRequests: [],
              currentValue: cookieData.value,
            })
          } else {
            const existing = cookieMap.get(key)!
            existing.setByRequests.push(requestIndex)
            existing.currentValue = cookieData.value
            // Update properties from latest set-cookie
            Object.assign(existing, cookieData)
          }
        }
      })
    })

    return {
      cookies: Array.from(cookieMap.values()),
      domains: Array.from(domains).sort(),
    }
  }, [entries])

  // Filter cookies
  const filteredCookies = useMemo(() => {
    return cookieAnalysis.cookies.filter((cookie) => {
      const matchesSearch =
        cookie.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cookie.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cookie.domain && cookie.domain.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesDomain = domainFilter === "all" || cookie.domain === domainFilter

      return matchesSearch && matchesDomain
    })
  }, [cookieAnalysis.cookies, searchTerm, domainFilter])

  // Group cookies by domain for overview
  const cookiesByDomain = useMemo(() => {
    const grouped = new Map<string, CookieInfo[]>()
    filteredCookies.forEach((cookie) => {
      const domain = cookie.domain || "unknown"
      if (!grouped.has(domain)) {
        grouped.set(domain, [])
      }
      grouped.get(domain)!.push(cookie)
    })
    return grouped
  }, [filteredCookies])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getCookieFlags = (cookie: CookieInfo) => {
    const flags = []
    if (cookie.secure) flags.push("Secure")
    if (cookie.httpOnly) flags.push("HttpOnly")
    if (cookie.sameSite) flags.push(`SameSite=${cookie.sameSite}`)
    return flags
  }

  const getCookieRisk = (cookie: CookieInfo) => {
    let risk = "low"
    const reasons = []

    if (!cookie.secure) {
      risk = "medium"
      reasons.push("Not secure")
    }
    if (!cookie.httpOnly) {
      risk = "medium"
      reasons.push("Accessible via JavaScript")
    }
    if (cookie.name.toLowerCase().includes("session") || cookie.name.toLowerCase().includes("auth")) {
      if (!cookie.secure || !cookie.httpOnly) {
        risk = "high"
        reasons.push("Authentication cookie without proper security")
      }
    }

    return { risk, reasons }
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Cookie className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
                  {cookieAnalysis.cookies.length}
                </p>
                <p className="text-xs text-muted-foreground">Total Cookies</p>
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
                  {cookieAnalysis.domains.length}
                </p>
                <p className="text-xs text-muted-foreground">Domains</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
                  {cookieAnalysis.cookies.filter((c) => c.secure && c.httpOnly).length}
                </p>
                <p className="text-xs text-muted-foreground">Secure Cookies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
                  {cookieAnalysis.cookies.filter((c) => getCookieRisk(c).risk === "high").length}
                </p>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-space-grotesk)]">Cookie Analysis</CardTitle>
          <CardDescription>Track cookie flow and identify security issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search cookies by name, value, or domain..."
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
                  {cookieAnalysis.domains
                    .filter((domain) => domain && domain.trim() !== "")
                    .map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowValues(!showValues)}
                className="flex items-center gap-2"
              >
                {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showValues ? "Hide Values" : "Show Values"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="security">Security Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {Array.from(cookiesByDomain.entries()).map(([domain, cookies]) => (
            <Card key={domain}>
              <CardHeader>
                <CardTitle className="text-lg font-[family-name:var(--font-space-grotesk)]">{domain}</CardTitle>
                <CardDescription>{cookies.length} cookies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cookies.map((cookie, index) => (
                    <CookieCard
                      key={index}
                      cookie={cookie}
                      showValues={showValues}
                      entries={entries}
                      formatDate={formatDate}
                      getCookieFlags={getCookieFlags}
                      getCookieRisk={getCookieRisk}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <CookieTimeline cookies={filteredCookies} entries={entries} formatDate={formatDate} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityAnalysis cookies={filteredCookies} getCookieRisk={getCookieRisk} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CookieCard({
  cookie,
  showValues,
  entries,
  formatDate,
  getCookieFlags,
  getCookieRisk,
}: {
  cookie: CookieInfo
  showValues: boolean
  entries: HarEntry[]
  formatDate: (dateString: string) => string
  getCookieFlags: (cookie: CookieInfo) => string[]
  getCookieRisk: (cookie: CookieInfo) => { risk: string; reasons: string[] }
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const flags = getCookieFlags(cookie)
  const { risk, reasons } = getCookieRisk(cookie)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-green-100 text-green-800 border-green-200"
    }
  }

  return (
    <Card className="border-l-4 border-l-primary/20">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="font-mono font-semibold">{cookie.name}</div>
                <Badge className={`${getRiskColor(risk)} border text-xs`}>{risk.toUpperCase()}</Badge>
                {flags.map((flag) => (
                  <Badge key={flag} variant="outline" className="text-xs">
                    {flag}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Set by {cookie.setByRequests.length} requests • Used in {cookie.usedInRequests.length} requests
              </div>
            </div>
            {showValues && (
              <div className="font-mono text-sm bg-muted p-2 rounded break-all">{cookie.currentValue}</div>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Properties</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Domain:</span> {cookie.domain}
                  </div>
                  <div>
                    <span className="font-medium">Path:</span> {cookie.path || "/"}
                  </div>
                  {cookie.expires && (
                    <div>
                      <span className="font-medium">Expires:</span> {cookie.expires}
                    </div>
                  )}
                  {cookie.maxAge && (
                    <div>
                      <span className="font-medium">Max-Age:</span> {cookie.maxAge}s
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Usage</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">First seen:</span> {formatDate(cookie.firstSeenAt)}
                  </div>
                  <div>
                    <span className="font-medium">Set by requests:</span> {cookie.setByRequests.join(", ")}
                  </div>
                  <div>
                    <span className="font-medium">Used in requests:</span> {cookie.usedInRequests.join(", ")}
                  </div>
                </div>
              </div>
            </div>
            {reasons.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-semibold text-sm text-yellow-800 mb-1">Security Concerns:</h4>
                <ul className="text-sm text-yellow-700 list-disc list-inside">
                  {reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function CookieTimeline({
  cookies,
  entries,
  formatDate,
}: { cookies: CookieInfo[]; entries: HarEntry[]; formatDate: (dateString: string) => string }) {
  const timelineEvents = useMemo(() => {
    const events: Array<{
      time: string
      type: "set" | "use"
      cookie: CookieInfo
      requestIndex: number
      url: string
    }> = []

    cookies.forEach((cookie) => {
      cookie.setByRequests.forEach((requestIndex) => {
        events.push({
          time: entries[requestIndex].startedDateTime,
          type: "set",
          cookie,
          requestIndex,
          url: entries[requestIndex].request.url,
        })
      })

      cookie.usedInRequests.forEach((requestIndex) => {
        events.push({
          time: entries[requestIndex].startedDateTime,
          type: "use",
          cookie,
          requestIndex,
          url: entries[requestIndex].request.url,
        })
      })
    })

    return events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  }, [cookies, entries])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-space-grotesk)]">Cookie Timeline</CardTitle>
        <CardDescription>Chronological view of cookie set and usage events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineEvents.map((event, index) => (
            <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
              <div className="flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${event.type === "set" ? "bg-green-500" : "bg-blue-500"} mt-1`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={event.type === "set" ? "default" : "secondary"} className="text-xs">
                    {event.type === "set" ? "SET" : "USE"}
                  </Badge>
                  <span className="font-mono font-semibold">{event.cookie.name}</span>
                  <span className="text-xs text-muted-foreground">Request #{event.requestIndex}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>{formatDate(event.time)}</div>
                  <div className="font-mono text-xs truncate">{event.url}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SecurityAnalysis({
  cookies,
  getCookieRisk,
}: { cookies: CookieInfo[]; getCookieRisk: (cookie: CookieInfo) => { risk: string; reasons: string[] } }) {
  const securityStats = useMemo(() => {
    const stats = {
      total: cookies.length,
      secure: cookies.filter((c) => c.secure).length,
      httpOnly: cookies.filter((c) => c.httpOnly).length,
      sameSite: cookies.filter((c) => c.sameSite).length,
      highRisk: cookies.filter((c) => getCookieRisk(c).risk === "high").length,
      mediumRisk: cookies.filter((c) => getCookieRisk(c).risk === "medium").length,
    }
    return stats
  }, [cookies, getCookieRisk])

  const highRiskCookies = cookies.filter((c) => getCookieRisk(c).risk === "high")
  const mediumRiskCookies = cookies.filter((c) => getCookieRisk(c).risk === "medium")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-space-grotesk)]">Security Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Secure Flag</span>
                <span>
                  {securityStats.secure}/{securityStats.total} (
                  {Math.round((securityStats.secure / securityStats.total) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span>HttpOnly Flag</span>
                <span>
                  {securityStats.httpOnly}/{securityStats.total} (
                  {Math.round((securityStats.httpOnly / securityStats.total) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span>SameSite Attribute</span>
                <span>
                  {securityStats.sameSite}/{securityStats.total} (
                  {Math.round((securityStats.sameSite / securityStats.total) * 100)}%)
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-red-600">
                <span>High Risk</span>
                <span>{securityStats.highRisk} cookies</span>
              </div>
              <div className="flex justify-between text-yellow-600">
                <span>Medium Risk</span>
                <span>{securityStats.mediumRisk} cookies</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Low Risk</span>
                <span>{securityStats.total - securityStats.highRisk - securityStats.mediumRisk} cookies</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {highRiskCookies.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 font-[family-name:var(--font-space-grotesk)]">
              High Risk Cookies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {highRiskCookies.map((cookie, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="font-mono font-semibold text-red-800">{cookie.name}</div>
                  <div className="text-sm text-red-600 mt-1">{getCookieRisk(cookie).reasons.join(", ")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {mediumRiskCookies.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 font-[family-name:var(--font-space-grotesk)]">
              Medium Risk Cookies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mediumRiskCookies.map((cookie, index) => (
                <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="font-mono font-semibold text-yellow-800">{cookie.name}</div>
                  <div className="text-sm text-yellow-600 mt-1">{getCookieRisk(cookie).reasons.join(", ")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper function to parse Set-Cookie header
function parseCookieHeader(setCookieValue: string): Partial<CookieInfo> | null {
  try {
    const parts = setCookieValue.split(";").map((part) => part.trim())
    const [nameValue] = parts
    const [name, value] = nameValue.split("=", 2)

    if (!name) return null

    const cookie: Partial<CookieInfo> = {
      name: name.trim(),
      value: value ? value.trim() : "",
    }

    parts.slice(1).forEach((part) => {
      const [key, val] = part.split("=", 2)
      const lowerKey = key.toLowerCase()

      switch (lowerKey) {
        case "domain":
          cookie.domain = val
          break
        case "path":
          cookie.path = val
          break
        case "expires":
          cookie.expires = val
          break
        case "max-age":
          cookie.maxAge = Number.parseInt(val, 10)
          break
        case "secure":
          cookie.secure = true
          break
        case "httponly":
          cookie.httpOnly = true
          break
        case "samesite":
          cookie.sameSite = val
          break
      }
    })

    return cookie
  } catch {
    return null
  }
}
