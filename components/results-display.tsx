"use client"

import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Info } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { SEOAuditResult, SEOIssue } from "@/types/seo-types"

interface ResultsDisplayProps {
  results: SEOAuditResult
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const getStatusIcon = (status: "good" | "warning" | "error") => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getImpactBadge = (impact?: "high" | "medium" | "low") => {
    if (!impact) return null

    const colors = {
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[impact]}`}>
        {impact}
      </span>
    )
  }

  return (
    <div className="w-full space-y-8">
      {/* Overall Score */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Overall SEO Score</CardTitle>
          <CardDescription>Based on {results.issues.length} checks performed on your website</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="relative w-40 h-40 mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold">{results.score}</span>
            </div>
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="text-muted-foreground/20"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className={`${
                  results.score >= 80 ? "text-green-500" : results.score >= 50 ? "text-yellow-500" : "text-red-500"
                }`}
                strokeWidth="10"
                strokeDasharray={`${results.score * 2.51} 251`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>
          <div className="text-center mb-4">
            <p className="text-lg font-medium">
              {results.score >= 80 ? "Good" : results.score >= 50 ? "Needs Improvement" : "Poor"}
            </p>
            <p className="text-sm text-muted-foreground">
              {results.score >= 80
                ? "Your website has good SEO practices"
                : results.score >= 50
                  ? "Your website needs some SEO improvements"
                  : "Your website has serious SEO issues"}
            </p>
          </div>
          <div className="flex justify-between w-full max-w-md gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{results.passedChecks}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{results.warningChecks}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{results.errorChecks}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-4">
            Scan completed in {(results.scanDuration / 1000).toFixed(2)} seconds
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Category Scores</CardTitle>
          <CardDescription>Breakdown of your SEO performance by category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {results.categoryScores.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{category.name}</span>
                <div className="flex items-center gap-2">
                  {category.issueCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {category.issueCount} {category.issueCount === 1 ? "issue" : "issues"}
                    </Badge>
                  )}
                  <span className="font-medium">{category.score}/100</span>
                </div>
              </div>
              <Progress value={category.score} className={`h-2 ${getScoreColor(category.score)}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Issues */}
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All Issues ({results.issues.length})</TabsTrigger>
          <TabsTrigger value="errors">Errors ({results.errorChecks})</TabsTrigger>
          <TabsTrigger value="warnings">Warnings ({results.warningChecks})</TabsTrigger>
          <TabsTrigger value="passed">Passed ({results.passedChecks})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <IssuesList issues={results.issues} />
        </TabsContent>

        <TabsContent value="errors">
          <IssuesList issues={results.issues.filter((issue) => issue.severity === "error")} />
        </TabsContent>

        <TabsContent value="warnings">
          <IssuesList issues={results.issues.filter((issue) => issue.severity === "warning")} />
        </TabsContent>

        <TabsContent value="passed">
          <IssuesList issues={results.issues.filter((issue) => issue.severity === "good")} />
        </TabsContent>
      </Tabs>

      {/* Download Report */}
      <div className="flex justify-center">
        <Button className="gap-2">
          Download Full Report
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface IssuesListProps {
  issues: SEOIssue[]
}

function IssuesList({ issues }: IssuesListProps) {
  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <p className="text-muted-foreground">No issues found in this category</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Accordion type="multiple" className="w-full">
          {issues.map((issue, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3 text-left">
                  {getStatusIcon(issue.severity)}
                  <div>
                    <div className="font-medium">{issue.title}</div>
                    <div className="text-sm text-muted-foreground">{issue.category}</div>
                  </div>
                  {issue.impact && (
                    <Badge
                      variant="outline"
                      className={`ml-auto mr-4 ${
                        issue.impact === "high"
                          ? "border-red-500 text-red-500"
                          : issue.impact === "medium"
                            ? "border-yellow-500 text-yellow-500"
                            : "border-blue-500 text-blue-500"
                      }`}
                    >
                      {issue.impact} impact
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 pt-0">
                <div className="pl-8 space-y-4">
                  <p>{issue.description}</p>

                  {issue.recommendation && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="font-medium flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Recommendation:
                      </p>
                      <p className="text-muted-foreground mt-1">{issue.recommendation}</p>
                    </div>
                  )}

                  {issue.elements && issue.elements.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Affected Elements:</p>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground mt-1">
                        {issue.elements.map((element, i) => (
                          <li key={i} className="break-all">
                            {element}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {issue.resourceLinks && issue.resourceLinks.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Learn More:</p>
                      <ul className="list-disc pl-5 text-sm mt-1">
                        {issue.resourceLinks.map((link, i) => (
                          <li key={i}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {link.title}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

function getStatusIcon(status: "good" | "warning" | "error") {
  switch (status) {
    case "good":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" />
  }
}

