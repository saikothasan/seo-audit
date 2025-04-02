"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ResultsDisplay from "@/components/results-display"
import { SectionTitle } from "@/components/section-title"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import type { SEOAuditResult } from "@/types/seo-types"

// Create a client component that uses useSearchParams
function ResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const url = searchParams.get("url")
  const [results, setResults] = useState<SEOAuditResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchResults() {
      if (!url) {
        setError("No URL provided")
        setLoading(false)
        return
      }

      try {
        // Show toast for starting analysis
        toast({
          title: "Analysis Started",
          description: "We're analyzing your website. This may take a moment.",
        })

        const response = await fetch(`/api/audit?url=${encodeURIComponent(url)}`)

        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a minute.")
        }

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setResults(data)

        // Show success toast
        toast({
          title: "Analysis Complete",
          description: "Your SEO audit has been completed successfully.",
          variant: "success",
        })
      } catch (err: any) {
        console.error("Error fetching results:", err)
        setError(err.message || "Failed to analyze the website. Please try again.")

        // Show error toast
        toast({
          title: "Analysis Failed",
          description: err.message || "Failed to analyze the website. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [url, toast])

  if (!url) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>No URL was provided for analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Please provide a URL to analyze.</p>
            <Button onClick={() => router.push("/")}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12">
      <div className="w-full max-w-6xl">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <SectionTitle title="SEO Audit Results" description={`Analysis for ${url}`} alignment="left" />

        {loading ? (
          <Card className="w-full mt-8 animate-pulse">
            <CardContent className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-16 w-16 animate-spin mb-6 text-primary" />
              <p className="text-xl font-medium mb-2">Analyzing your website...</p>
              <p className="text-muted-foreground">This may take a minute. We're checking over 50 SEO factors.</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Alert variant="destructive" className="mt-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button onClick={() => router.push("/")} className="mt-4" variant="outline">
              Try Again
            </Button>
          </Alert>
        ) : results ? (
          <div className="mt-8 animate-fade-in">
            <ResultsDisplay results={results} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-16 w-16 animate-spin mb-6 text-primary" />
              <p className="text-xl font-medium mb-2">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}

