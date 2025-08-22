"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HARData } from "@/lib/types"


interface HarUploaderProps {
  onUpload: (data: HARData) => void
}

export function HarUploader({ onUpload }: HarUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(
    async (file: File) => {
      setIsLoading(true)
      setError(null)

      try {
        if (!file.name.endsWith(".har")) {
          throw new Error("Please upload a .har file")
        }

        const text = await file.text()
        const harData = JSON.parse(text) as HARData

        // Validate HAR structure
        if (!harData.log || !Array.isArray(harData.log.entries)) {
          throw new Error("Invalid HAR file format")
        }

        console.log(`Loaded HAR file with ${harData.log.entries.length} entries`)
        onUpload(harData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to parse HAR file"
        setError(errorMessage)
        console.error("HAR file parsing error:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [onUpload],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const harFile = files.find((file) => file.name.endsWith(".har"))

      if (harFile) {
        processFile(harFile)
      } else {
        setError("Please drop a .har file")
      }
    },
    [processFile],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver ? "border-primary bg-primary/5" : "border-border"}
          ${isLoading ? "opacity-50 pointer-events-none" : "hover:border-primary/50"}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <input
          type="file"
          accept=".har"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {isLoading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Upload className="h-6 w-6 text-primary" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
              {isLoading ? "Processing HAR file..." : "Drop your HAR file here"}
            </h3>
            <p className="text-sm text-muted-foreground">Or click to browse and select a .har file</p>
          </div>

          <Button variant="outline" disabled={isLoading}>
            <FileText className="mr-2 h-4 w-4" />
            Choose File
          </Button>
        </div>
      </div>
    </div>
  )
}
