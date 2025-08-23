import { FileText } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-card/10 sticky top-0 backdrop-blur-xl z-10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-card-foreground">
              HAR File Analyzer
            </h1>
            <p className="text-sm text-muted-foreground">
              Reverse engineer APIs with cookie tracking and flow analysis
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
