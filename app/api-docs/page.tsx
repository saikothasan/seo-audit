import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowRight, FileCode, Server, Lock } from "lucide-react"

export const metadata: Metadata = {
  title: "API Documentation - SEO Audit Tool",
  description: "Comprehensive documentation for the SEO Audit Tool API",
}

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-6 gradient-text">API Documentation</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Integrate our SEO audit capabilities into your own applications
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Alert className="mb-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Rate Limits</AlertTitle>
              <AlertDescription>
                The API is limited to 5 requests per minute per IP address to ensure service availability for all users.
              </AlertDescription>
            </Alert>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="h-5 w-5 mr-2 text-primary" />
                  Getting Started
                </CardTitle>
                <CardDescription>Our API allows you to perform SEO audits programmatically</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The SEO Audit API is free to use with reasonable rate limits. No authentication is required for basic
                  usage.
                </p>
                <div className="bg-muted p-4 rounded-md">
                  <p className="font-medium mb-2">Base URL:</p>
                  <code className="bg-background px-2 py-1 rounded text-sm">https://seo-audit-tool.com/api</code>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="audit" className="mb-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="audit">Audit Endpoint</TabsTrigger>
                <TabsTrigger value="response">Response Format</TabsTrigger>
                <TabsTrigger value="errors">Error Handling</TabsTrigger>
              </TabsList>
              <TabsContent value="audit" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileCode className="h-5 w-5 mr-2 text-primary" />
                      GET /api/audit
                    </CardTitle>
                    <CardDescription>Perform an SEO audit on a specified URL</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Parameters</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left">Name</th>
                              <th className="px-4 py-3 text-left">Type</th>
                              <th className="px-4 py-3 text-left">Required</th>
                              <th className="px-4 py-3 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t">
                              <td className="px-4 py-3">url</td>
                              <td className="px-4 py-3">string</td>
                              <td className="px-4 py-3">Yes</td>
                              <td className="px-4 py-3">The URL to audit (must include http:// or https://)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3">Example Request</h3>
                      <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                        <code>GET /api/audit?url=https://example.com</code>
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3">Rate Limits</h3>
                      <p>
                        The API is limited to 5 requests per minute per IP address. If you exceed this limit, you'll
                        receive a 429 Too Many Requests response.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="response" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Response Format</CardTitle>
                    <CardDescription>The API returns a JSON object with the following structure</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Response Fields</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left">Field</th>
                              <th className="px-4 py-3 text-left">Type</th>
                              <th className="px-4 py-3 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t">
                              <td className="px-4 py-3">url</td>
                              <td className="px-4 py-3">string</td>
                              <td className="px-4 py-3">The URL that was audited</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-3">score</td>
                              <td className="px-4 py-3">number</td>
                              <td className="px-4 py-3">Overall SEO score (0-100)</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-3">passedChecks</td>
                              <td className="px-4 py-3">number</td>
                              <td className="px-4 py-3">Number of checks that passed</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-3">warningChecks</td>
                              <td className="px-4 py-3">number</td>
                              <td className="px-4 py-3">Number of checks with warnings</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-3">errorChecks</td>
                              <td className="px-4 py-3">number</td>
                              <td className="px-4 py-3">Number of checks with errors</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-3">categoryScores</td>
                              <td className="px-4 py-3">array</td>
                              <td className="px-4 py-3">Scores for each category</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-3">issues</td>
                              <td className="px-4 py-3">array</td>
                              <td className="px-4 py-3">List of SEO issues found</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-3">timestamp</td>
                              <td className="px-4 py-3">string</td>
                              <td className="px-4 py-3">ISO timestamp of when the audit was performed</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-3">scanDuration</td>
                              <td className="px-4 py-3">number</td>
                              <td className="px-4 py-3">Time taken to complete the scan in milliseconds</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-3">pageTitle</td>
                              <td className="px-4 py-3">string</td>
                              <td className="px-4 py-3">Title of the audited page</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3">Example Response</h3>
                      <pre className="p-4 bg-muted rounded-md overflow-x-auto text-xs">
                        <code>{`{
  "url": "https://example.com",
  "score": 75,
  "passedChecks": 6,
  "warningChecks": 2,
  "errorChecks": 2,
  "categoryScores": [
    {
      "name": "Meta Tags",
      "score": 83,
      "issueCount": 1
    },
    {
      "name": "Content Structure",
      "score": 100,
      "issueCount": 0
    },
    {
      "name": "Images",
      "score": 50,
      "issueCount": 1
    }
  ],
  "issues": [
    {
      "title": "Good title length",
      "description": "Your title is 45 characters long, which is optimal.",
      "severity": "good",
      "category": "Meta Tags"
    },
    {
      "title": "Images missing alt text",
      "description": "3 images are missing alt text.",
      "severity": "error",
      "category": "Images",
      "impact": "high",
      "recommendation": "Add descriptive alt text to all images for better accessibility and SEO.",
      "elements": [
        "/image1.jpg",
        "/image2.png",
        "/logo.svg"
      ],
      "resourceLinks": [
        {
          "title": "Image Alt Text",
          "url": "https://moz.com/learn/seo/alt-text"
        }
      ]
    }
  ],
  "timestamp": "2023-04-02T03:40:39.000Z",
  "scanDuration": 1542,
  "pageTitle": "Example Domain"
}`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="errors" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-primary" />
                      Error Handling
                    </CardTitle>
                    <CardDescription>The API returns appropriate HTTP status codes and error messages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Error Responses</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left">Status Code</th>
                              <th className="px-4 py-3 text-left">Error</th>
                              <th className="px-4 py-3 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t">
                              <td className="px-4 py-3">400</td>
                              <td className="px-4 py-3">Bad Request</td>
                              <td className="px-4 py-3">Missing or invalid URL parameter</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-3">429</td>
                              <td className="px-4 py-3">Too Many Requests</td>
                              <td className="px-4 py-3">Rate limit exceeded</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-3">500</td>
                              <td className="px-4 py-3">Internal Server Error</td>
                              <td className="px-4 py-3">Server error while processing the request</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3">Example Error Response</h3>
                      <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                        <code>{`{
  "error": "Rate limit exceeded. Please try again later."
}`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle>Code Examples</CardTitle>
                <CardDescription>How to use the API in different programming languages</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="javascript">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="php">PHP</TabsTrigger>
                  </TabsList>
                  <TabsContent value="javascript" className="mt-6">
                    <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                      <code>{`// Using fetch with error handling and rate limit handling
async function auditWebsite(url) {
  try {
    const response = await fetch(
      \`https://seo-audit-tool.com/api/audit?url=\${encodeURIComponent(url)}\`
    );
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after') || 60;
      console.log(\`Rate limit exceeded. Retry after \${retryAfter} seconds.\`);
      return { error: 'Rate limit exceeded', retryAfter };
    }
    
    if (!response.ok) {
      throw new Error(\`Error: \${response.status}\`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    return { error: error.message };
  }
}

// Example usage
auditWebsite('https://example.com')
  .then(result => {
    if (result.error) {
      console.error(result.error);
      return;
    }
    
    console.log(\`Overall SEO score: \${result.score}\`);
    console.log(\`Issues found: \${result.issues.length}\`);
    
    // Process issues by severity
    const errors = result.issues.filter(issue => issue.severity === 'error');
    const warnings = result.issues.filter(issue => issue.severity === 'warning');
    const passed = result.issues.filter(issue => issue.severity === 'good');
    
    console.log(\`Errors: \${errors.length}\`);
    console.log(\`Warnings: \${warnings.length}\`);
    console.log(\`Passed: \${passed.length}\`);
  });`}</code>
                    </pre>
                  </TabsContent>
                  <TabsContent value="python" className="mt-6">
                    <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                      <code>{`import requests
import time

def audit_website(url):
    try:
        response = requests.get(
            'https://seo-audit-tool.com/api/audit',
            params={'url': url}
        )
        
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            print(f"Rate limit exceeded. Retry after {retry_after} seconds.")
            return {'error': 'Rate limit exceeded', 'retry_after': retry_after}
        
        response.raise_for_status()  # Raise exception for other 4XX/5XX responses
        return response.json()
    
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return {'error': str(e)}

# Example usage
def process_seo_results(result):
    if 'error' in result:
        print(f"Error: {result['error']}")
        if 'retry_after' in result:
            print(f"Waiting {result['retry_after']} seconds before retrying...")
            time.sleep(result['retry_after'])
            # You could retry the request here
        return
    
    print(f"Overall SEO score: {result['score']}")
    print(f"Issues found: {len(result['issues'])}")
    
    # Process issues by severity
    errors = [issue for issue in result['issues'] if issue['severity'] == 'error']
    warnings = [issue for issue in result['issues'] if issue['severity'] == 'warning']
    passed = [issue for issue in result['issues'] if issue['severity'] == 'good']
    
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    print(f"Passed: {len(passed)}")

# Run the audit
result = audit_website('https://example.com')
process_seo_results(result)`}</code>
                    </pre>
                  </TabsContent>
                  <TabsContent value="php" className="mt-6">
                    <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                      <code>{`<?php
function auditWebsite($url) {
    $apiUrl = 'https://seo-audit-tool.com/api/audit?url=' . urlencode($url);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);
    
    if (curl_errno($ch)) {
        curl_close($ch);
        return ['error' => curl_error($ch)];
    }
    
    curl_close($ch);
    
    if ($httpCode === 429) {
        preg_match('/Retry-After: (\\d+)/', $headers, $matches);
        $retryAfter = isset($matches[1]) ? (int)$matches[1] : 60;
        return [
            'error' => 'Rate limit exceeded',
            'retry_after' => $retryAfter
        ];
    }
    
    if ($httpCode >= 400) {
        return ['error' => "HTTP Error: $httpCode"];
    }
    
    return json_decode($body, true);
}

// Example usage
$result = auditWebsite('https://example.com');

if (isset($result['error'])) {
    echo "Error: " . $result['error'] . PHP_EOL;
    if (isset($result['retry_after'])) {
        echo "Retry after: " . $result['retry_after'] . " seconds" . PHP_EOL;
        // You could implement a retry mechanism here
    }
} else {
    echo "Overall SEO score: " . $result['score'] . PHP_EOL;
    echo "Issues found: " . count($result['issues']) . PHP_EOL;
    
    // Process issues by severity
    $errors = array_filter($result['issues'], function($issue) {
        return $issue['severity'] === 'error';
    });
    
    $warnings = array_filter($result['issues'], function($issue) {
        return $issue['severity'] === 'warning';
    });
    
    $passed = array_filter($result['issues'], function($issue) {
        return $issue['severity'] === 'good';
    });
    
    echo "Errors: " . count($errors) . PHP_EOL;
    echo "Warnings: " . count($warnings) . PHP_EOL;
    echo "Passed: " . count($passed) . PHP_EOL;
}
?>`}</code>
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/">
                    Try the SEO Audit Tool
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

