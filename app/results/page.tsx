"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

// This is a shortened version of our type definition to save space
// The full interface would include all the properties returned by the API
interface SeoAuditResult {
  url: string
  overallScore: number
  timestamp: string
  metaTags: any
  headings: any
  contentAnalysis: any
  urlAnalysis: any
  images: any
  socialTags: any
  schemaMarkup: any
  links: any
  mobileFriendliness: any
  security: any
  performance: any
  keywords: any
  canonical: any
  hreflang: any
  robotsTxt: any
  sitemap: any
  readability: any
  language: any
  ampAnalysis: any
  favicon: any
  duplicateContent: any
  issues: {
    critical: string[]
    major: string[]
    minor: string[]
  }
  recommendations: string[]
}

// Wrap the component that uses useSearchParams in a separate component
function ResultsContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get("url")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) {
      setError("No URL provided")
      setLoading(false)
      return
    }

    const fetchResults = async () => {
      try {
        const response = await fetch("/api/audit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch results")
        }

        const data = await response.json()
        setResult(data)
        toast({
          title: "Audit Complete",
          description: "SEO audit has been successfully completed.",
          className: "bg-green-50 border-green-200",
        })
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching results")
        toast({
          title: "Error",
          description: err.message || "An error occurred while fetching results",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [url])

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!result) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>No Results</AlertTitle>
        <AlertDescription>No audit results available.</AlertDescription>
      </Alert>
    )
  }

  // Rest of the component remains the same...
  // (Keep all the existing JSX and functionality)
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Overall Score</CardTitle>
            <CardDescription>
              Based on {result.issues.critical.length + result.issues.major.length + result.issues.minor.length} issues
              found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="relative h-40 w-40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold">{result.overallScore}</span>
                </div>
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle className="stroke-gray-200" cx="50" cy="50" r="45" fill="transparent" strokeWidth="10" />
                  <circle
                    className={`stroke-current ${
                      result.overallScore >= 80
                        ? "text-green-500"
                        : result.overallScore >= 60
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    strokeWidth="10"
                    strokeDasharray={`${(result.overallScore / 100) * 283} 283`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Last updated: {new Date(result.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Issues Summary</CardTitle>
            <CardDescription>Categorized by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-red-600">Critical Issues</span>
                  <span className="text-sm font-medium text-red-600">{result.issues.critical.length}</span>
                </div>
                <Progress value={result.issues.critical.length * 10} className="h-2 bg-red-100 bg-red-600" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-600">Major Issues</span>
                  <span className="text-sm font-medium text-yellow-600">{result.issues.major.length}</span>
                </div>
                <Progress value={result.issues.major.length * 5} className="h-2 bg-yellow-100 bg-yellow-600" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600">Minor Issues</span>
                  <span className="text-sm font-medium text-blue-600">{result.issues.minor.length}</span>
                </div>
                <Progress value={result.issues.minor.length * 2} className="h-2 bg-blue-100 bg-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="all-issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>URL Information</CardTitle>
              <CardDescription>{result.url}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Protocol</h3>
                    <p className="text-sm">{result.urlAnalysis.protocol}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Hostname</h3>
                    <p className="text-sm">{result.urlAnalysis.hostname}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Path</h3>
                    <p className="text-sm">{result.urlAnalysis.path || "/"}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">HTTPS Security</h3>
                    <p className={`text-sm ${result.security.https.isHttps ? "text-green-600" : "text-red-600"}`}>
                      {result.security.https.isHttps ? "Secure" : "Not Secure"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Recommendations</CardTitle>
              <CardDescription>Top actions to improve your SEO</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.recommendations.slice(0, 8).map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Critical Issues</CardTitle>
                <CardDescription>High priority items to fix</CardDescription>
              </CardHeader>
              <CardContent>
                {result.issues.critical.length > 0 ? (
                  <ul className="space-y-2">
                    {result.issues.critical.map((issue: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>No critical issues found!</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Major Issues</CardTitle>
                <CardDescription>Important items to address</CardDescription>
              </CardHeader>
              <CardContent>
                {result.issues.major.length > 0 ? (
                  <ul className="space-y-2">
                    {result.issues.major.slice(0, 6).map((issue: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                    {result.issues.major.length > 6 && (
                      <li className="text-sm text-gray-500">
                        + {result.issues.major.length - 6} more issues (see Issues tab)
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>No major issues found!</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content tab with comprehensive analysis */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meta Tags</CardTitle>
              <CardDescription>Important meta information for search engines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Title</h3>
                  <p className="text-sm">{result.metaTags.title || "Not found"}</p>
                  <p className="text-xs text-gray-500">
                    Length: {result.metaTags.title?.length || 0} characters
                    {result.metaTags.title?.length > 60 && (
                      <span className="text-yellow-600"> (Too long, should be under 60 characters)</span>
                    )}
                    {result.metaTags.title?.length < 30 && result.metaTags.title?.length > 0 && (
                      <span className="text-yellow-600"> (Too short, should be at least 30 characters)</span>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="text-sm">{result.metaTags.description || "Not found"}</p>
                  <p className="text-xs text-gray-500">
                    Length: {result.metaTags.description?.length || 0} characters
                    {result.metaTags.description?.length > 160 && (
                      <span className="text-yellow-600"> (Too long, should be under 160 characters)</span>
                    )}
                    {result.metaTags.description?.length < 50 && result.metaTags.description?.length > 0 && (
                      <span className="text-yellow-600"> (Too short, should be at least 50 characters)</span>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Keywords</h3>
                  <p className="text-sm">{result.metaTags.keywords || "Not found"}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Canonical URL</h3>
                  <p className="text-sm">{result.metaTags.canonical || "Not found"}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Robots</h3>
                  <p className="text-sm">{result.metaTags.robots || "Not found"}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Language</h3>
                  <p className="text-sm">{result.metaTags.language || "Not specified"}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Indexability</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.metaTags.indexability?.noindex ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        noindex
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        index
                      </Badge>
                    )}
                    {result.metaTags.indexability?.nofollow ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        nofollow
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        follow
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Heading Structure</CardTitle>
              <CardDescription>Hierarchy of headings on the page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">H1 Tags</h3>
                    <p className={`text-sm ${result.headings.h1 !== 1 ? "text-red-600" : "text-green-600"}`}>
                      {result.headings.h1} {result.headings.h1 === 1 ? "✓" : "✗"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">H2 Tags</h3>
                    <p className="text-sm">{result.headings.h2}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">H3 Tags</h3>
                    <p className="text-sm">{result.headings.h3}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">H1 Content</h3>
                  {result.headings.h1Text?.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm">
                      {result.headings.h1Text.map((text: string, index: number) => (
                        <li key={index}>{text}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-red-600">No H1 heading found</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Heading Hierarchy</h3>
                  <p className={`text-sm ${result.headings.nestedStructure ? "text-green-600" : "text-red-600"}`}>
                    {result.headings.nestedStructure
                      ? "Proper heading hierarchy ✓"
                      : "Improper heading hierarchy - headings skip levels ✗"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Analysis</CardTitle>
              <CardDescription>Text content metrics and readability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Word Count</h3>
                    <p
                      className={`text-sm ${result.contentAnalysis.wordCount < 300 ? "text-yellow-600" : "text-green-600"}`}
                    >
                      {result.contentAnalysis.wordCount} words
                      {result.contentAnalysis.wordCount < 300 && " (Too short)"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Paragraphs</h3>
                    <p className="text-sm">{result.contentAnalysis.paragraphs}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Reading Time</h3>
                    <p className="text-sm">{result.contentAnalysis.readingTimeMinutes} min</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Content Structure</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Lists: {result.contentAnalysis.lists}</p>
                      <p className="text-xs text-gray-500">List Items: {result.contentAnalysis.listItems}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tables: {result.contentAnalysis.tables}</p>
                      <p className="text-xs text-gray-500">
                        Visual Elements: {result.contentAnalysis.hasVisualElements ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Readability</h3>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={result.readability.readabilityScore}
                      className={`h-2 ${
                        result.readability.readabilityScore >= 70
                          ? "bg-green-600"
                          : result.readability.readabilityScore >= 50
                            ? "bg-yellow-600"
                            : "bg-red-600"
                      }`}
                    />
                    <span className="text-sm">{result.readability.readabilityScore.toFixed(1)}</span>
                  </div>
                  <p className="text-sm">Level: {result.readability.readabilityLevel}</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Sentences: {result.readability.textStats.sentences}</p>
                      <p className="text-xs text-gray-500">Words: {result.readability.textStats.words}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        Avg. words per sentence: {result.readability.textStats.averageWordsPerSentence.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Passive voice instances: {result.readability.textStats.passiveVoice || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Text/HTML Ratio</h3>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={result.contentAnalysis.textToHtmlRatio * 100}
                      className={`h-2 ${
                        result.contentAnalysis.textToHtmlRatio >= 0.25
                          ? "bg-green-600"
                          : result.contentAnalysis.textToHtmlRatio >= 0.1
                            ? "bg-yellow-600"
                            : "bg-red-600"
                      }`}
                    />
                    <span className="text-sm">{(result.contentAnalysis.textToHtmlRatio * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {result.duplicateContent?.hasDuplicates && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-yellow-600">Duplicate Content</h3>
                    <p className="text-sm">
                      Found {result.duplicateContent.duplicateCount} paragraphs with duplicate content on the page
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keyword Analysis</CardTitle>
              <CardDescription>Keyword usage and optimization</CardDescription>
            </CardHeader>
            <CardContent>
              {result.keywords.sortedKeywords?.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium">Keyword</th>
                          <th className="pb-2 text-center font-medium">In Title</th>
                          <th className="pb-2 text-center font-medium">In H1</th>
                          <th className="pb-2 text-center font-medium">In URL</th>
                          <th className="pb-2 text-center font-medium">In Meta Desc</th>
                          <th className="pb-2 text-right font-medium">Occurrences</th>
                          <th className="pb-2 text-right font-medium">Density</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.keywords.sortedKeywords.map((keyword: any, index: number) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-2">{keyword.keyword}</td>
                            <td className="py-2 text-center">
                              {keyword.inTitle ? (
                                <CheckCircle className="h-4 w-4 text-green-500 inline" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 inline" />
                              )}
                            </td>
                            <td className="py-2 text-center">
                              {keyword.inH1 ? (
                                <CheckCircle className="h-4 w-4 text-green-500 inline" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 inline" />
                              )}
                            </td>
                            <td className="py-2 text-center">
                              {keyword.inUrl ? (
                                <CheckCircle className="h-4 w-4 text-green-500 inline" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 inline" />
                              )}
                            </td>
                            <td className="py-2 text-center">
                              {keyword.inMetaDescription ? (
                                <CheckCircle className="h-4 w-4 text-green-500 inline" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 inline" />
                              )}
                            </td>
                            <td className="py-2 text-right">{keyword.occurrences}</td>
                            <td
                              className={`py-2 text-right ${keyword.density > 0.05 ? "text-red-600" : keyword.density < 0.005 ? "text-yellow-600" : "text-green-600"}`}
                            >
                              {(keyword.density * 100).toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Keyword Placement</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">In Title:</span>
                          <span className="text-xs font-medium">{result.keywords.stats.keywordsInTitle}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">In H1:</span>
                          <span className="text-xs font-medium">{result.keywords.stats.keywordsInH1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">In Meta Desc:</span>
                          <span className="text-xs font-medium">{result.keywords.stats.keywordsInMetaDescription}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">In URL:</span>
                          <span className="text-xs font-medium">{result.keywords.stats.keywordsInUrl}</span>
                        </div>
                      </div>
                    </div>

                    {result.keywords.issues.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Keyword Issues</h3>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {result.keywords.issues.map((issue: string, index: number) => (
                            <li key={index} className="text-yellow-600">
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-yellow-600">No keywords detected or analyzed</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would follow similarly... */}

        <TabsContent value="all-issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Issues</CardTitle>
              <CardDescription>Complete list of all detected issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-red-600">Critical Issues</h3>
                  {result.issues.critical.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {result.issues.critical.map((issue: string, index: number) => (
                        <li key={index} className="text-red-600">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-600">No critical issues found</p>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-yellow-600">Major Issues</h3>
                  {result.issues.major.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {result.issues.major.map((issue: string, index: number) => (
                        <li key={index} className="text-yellow-600">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-600">No major issues found</p>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-blue-600">Minor Issues</h3>
                  {result.issues.minor.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {result.issues.minor.map((issue: string, index: number) => (
                        <li key={index} className="text-blue-600">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-600">No minor issues found</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Recommendations</CardTitle>
              <CardDescription>Complete list of improvement suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.recommendations.length > 0 ? (
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    {result.recommendations.map((recommendation: string, index: number) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-600">No recommendations available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="relative h-40 w-40">
                <Skeleton className="h-full w-full rounded-full" />
              </div>
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main component with Suspense boundary
export default function ResultsPage() {
  return (
    <div className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">SEO Audit Results</h1>
      <Suspense fallback={<LoadingState />}>
        <ResultsContent />
      </Suspense>
    </div>
  )
}

