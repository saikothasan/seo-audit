import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle, Zap, Shield, Search, BarChart, Globe } from "lucide-react"
import AuditForm from "@/components/audit-form"
import { SectionTitle } from "@/components/section-title"
import Features from "@/components/features"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "SEO Audit Tool - Professional Website Analysis",
  description:
    "Free comprehensive SEO audit tool to analyze your website's SEO performance and get actionable insights to improve your search engine rankings.",
}

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background z-0"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 gradient-text">
              Professional SEO Audit Tool
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Analyze your website's SEO performance and get actionable insights to improve your search rankings
            </p>
            <div className="animate-slide-up">
              <AuditForm />
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                <span>No Registration Required</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                <span>Detailed Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Comprehensive SEO Analysis"
            description="Our tool checks for these critical SEO factors and more"
          />
          <div className="mt-12">
            <Features />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title="How It Works" description="Get a complete SEO analysis in just a few seconds" />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card-hover border-t-4 border-t-primary">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Enter Your URL</h3>
                <p className="text-muted-foreground">
                  Simply enter your website URL in the form above and click "Analyze SEO"
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover border-t-4 border-t-primary">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Instant Analysis</h3>
                <p className="text-muted-foreground">
                  Our advanced algorithms will scan your website and analyze over 50 SEO factors
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover border-t-4 border-t-primary">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <BarChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Get Results</h3>
                <p className="text-muted-foreground">
                  Receive a detailed report with actionable recommendations to improve your SEO
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Use Our SEO Audit Tool?</h2>
              <div className="space-y-4">
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Comprehensive Analysis</h3>
                    <p className="text-muted-foreground mt-1">
                      Our tool checks over 50 SEO factors including meta tags, content quality, mobile-friendliness, and
                      more.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Actionable Recommendations</h3>
                    <p className="text-muted-foreground mt-1">
                      Get specific recommendations to fix issues and improve your search engine rankings.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Easy to Use</h3>
                    <p className="text-muted-foreground mt-1">
                      No technical knowledge required. Just enter your URL and get instant results.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Free API Access</h3>
                    <p className="text-muted-foreground mt-1">
                      Integrate our SEO audit capabilities into your own applications with our free API.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button asChild>
                  <Link href="/api-docs">
                    Learn About Our API
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-lg blur-lg opacity-50"></div>
              <div className="relative bg-card rounded-lg shadow-lg p-6 border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold text-center">Security Analysis</h4>
                    <p className="text-sm text-center text-muted-foreground mt-1">SSL & security headers</p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Globe className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold text-center">Mobile Friendly</h4>
                    <p className="text-sm text-center text-muted-foreground mt-1">Responsive design check</p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Zap className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold text-center">Performance</h4>
                    <p className="text-sm text-center text-muted-foreground mt-1">Page speed analysis</p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Search className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold text-center">SEO Score</h4>
                    <p className="text-sm text-center text-muted-foreground mt-1">Overall rating & metrics</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Overall SEO Score</span>
                    <span className="text-sm font-medium">85/100</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Improve Your SEO?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Get a comprehensive SEO audit of your website and start climbing the search rankings today.
              </p>
              <Button size="lg" className="text-lg px-8">
                <Link href="/#top">Analyze Your Website Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

