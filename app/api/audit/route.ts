import { type NextRequest, NextResponse } from "next/server"
import { JSDOM } from "jsdom"
import axios from "axios"
import * as cheerio from "cheerio"
import { rateLimit } from "@/lib/rate-limit"
import type {
  SEOAuditResult,
  SEOIssue,
  WebsiteData,
  MetaTags,
  HeadingStructure,
  ImageInfo,
  LinkInfo,
  CategoryScore,
  StructuredData,
  SecurityInfo,
  PerformanceMetrics,
} from "@/types/seo-types"

// Create a limiter that allows 10 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 100, // Max 100 users per interval
})

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  const ip = request.headers.get("x-forwarded-for") || "anonymous"

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  try {
    // Check rate limit
    await limiter.check(5, ip) // 5 requests per minute per IP

    // Start timing the scan
    const startTime = Date.now()

    // Fetch the website data
    const websiteData = await fetchWebsiteData(url)

    // Analyze the website data
    const auditResult = analyzeWebsite(websiteData)

    // Add scan duration
    auditResult.scanDuration = Date.now() - startTime

    return NextResponse.json(auditResult)
  } catch (error: any) {
    console.error("Error during SEO audit:", error)

    if (error.statusCode === 429) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }

    return NextResponse.json(
      { error: error.message || "Failed to analyze the website" },
      { status: error.statusCode || 500 },
    )
  }
}

async function fetchWebsiteData(url: string): Promise<WebsiteData> {
  const startTime = Date.now()

  try {
    // Validate URL format
    try {
      new URL(url)
    } catch (e) {
      throw new Error("Invalid URL format")
    }

    // Track redirects
    const redirectChain: string[] = []

    // Fetch the website with axios
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "SEO-Audit-Tool/1.0 (+https://seo-audit-tool.com/bot)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => {
        return status < 500 // Accept all status codes less than 500
      },
      transformResponse: [(data) => data], // Prevent JSON parsing
      beforeRedirect: (options, { headers }) => {
        if (options.url) {
          redirectChain.push(options.url)
        }
      },
    })

    // Calculate load time
    const loadTime = Date.now() - startTime

    // Check if the response is HTML
    const contentType = response.headers["content-type"] || ""
    if (!contentType.includes("text/html")) {
      throw new Error(`Unsupported content type: ${contentType}`)
    }

    // Parse HTML with cheerio for better performance
    const $ = cheerio.load(response.data)

    // Use JSDOM for more complex DOM operations
    const dom = new JSDOM(response.data)
    const document = dom.window.document

    // Extract meta tags
    const metaTags: MetaTags = extractMetaTags($)

    // Extract headings
    const headings: HeadingStructure = {
      h1: $("h1")
        .map((_, el) => $(el).text().trim())
        .get(),
      h2: $("h2")
        .map((_, el) => $(el).text().trim())
        .get(),
      h3: $("h3")
        .map((_, el) => $(el).text().trim())
        .get(),
      h4: $("h4")
        .map((_, el) => $(el).text().trim())
        .get(),
      h5: $("h5")
        .map((_, el) => $(el).text().trim())
        .get(),
      h6: $("h6")
        .map((_, el) => $(el).text().trim())
        .get(),
    }

    // Extract images
    const images: ImageInfo[] = extractImages($, url)

    // Extract links
    const links: LinkInfo[] = extractLinks($, url)

    // Check for broken links (limited to internal links to avoid too many requests)
    const brokenLinks = await checkBrokenLinks(links.filter((link) => link.isInternal).slice(0, 10), url)

    // Extract structured data
    const structuredData = extractStructuredData($)

    // Check security
    const security = checkSecurity(response.headers, url)

    // Extract CSS and JS files
    const cssFiles = $('link[rel="stylesheet"]')
      .map((_, el) => $(el).attr("href"))
      .get()
    const jsFiles = $("script")
      .map((_, el) => $(el).attr("src"))
      .get()
      .filter(Boolean)

    // Calculate content metrics
    const bodyText = $("body").text().trim()
    const contentLength = bodyText.length
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length

    // Calculate text to HTML ratio
    const htmlSize = response.data.length
    const textToHtmlRatio = htmlSize > 0 ? (contentLength / htmlSize) * 100 : 0

    // Extract keywords (simple implementation)
    const keywords = extractKeywords(bodyText)

    // Check for sitemap and robots.txt
    const hasSitemap = await checkFileExists(new URL(url).origin + "/sitemap.xml")
    const hasRobotsTxt = await checkFileExists(new URL(url).origin + "/robots.txt")

    // Performance metrics
    const performance: PerformanceMetrics = {
      loadTime,
      // Other metrics would require browser rendering
    }

    // Server information
    const serverInfo = {
      server: response.headers["server"] || undefined,
      poweredBy: response.headers["x-powered-by"] || undefined,
      contentType: response.headers["content-type"] || undefined,
      cacheControl: response.headers["cache-control"] || undefined,
    }

    return {
      url,
      statusCode: response.status,
      redirectChain,
      title: metaTags.title || "",
      metaTags,
      headings,
      images,
      links,
      contentLength,
      wordCount,
      textToHtmlRatio,
      performance,
      security,
      structuredData,
      hasSitemap,
      hasRobotsTxt,
      mobileCompatible: metaTags.viewport?.includes("width=device-width") || false,
      brokenLinks,
      serverInfo,
      cssFiles,
      jsFiles,
      keywords,
    }
  } catch (error: any) {
    console.error("Error fetching website data:", error)
    throw new Error(`Failed to fetch website data: ${error.message}`)
  }
}

function extractMetaTags($: cheerio.CheerioAPI): MetaTags {
  const metaTags: MetaTags = {
    title: $("title").text() || undefined,
    description: $('meta[name="description"]').attr("content") || undefined,
    keywords: $('meta[name="keywords"]').attr("content") || undefined,
    viewport: $('meta[name="viewport"]').attr("content") || undefined,
    robots: $('meta[name="robots"]').attr("content") || undefined,
    canonical: $('link[rel="canonical"]').attr("href") || undefined,
    ogTitle: $('meta[property="og:title"]').attr("content") || undefined,
    ogDescription: $('meta[property="og:description"]').attr("content") || undefined,
    ogImage: $('meta[property="og:image"]').attr("content") || undefined,
    ogType: $('meta[property="og:type"]').attr("content") || undefined,
    ogUrl: $('meta[property="og:url"]').attr("content") || undefined,
    ogSiteName: $('meta[property="og:site_name"]').attr("content") || undefined,
    twitterCard: $('meta[name="twitter:card"]').attr("content") || undefined,
    twitterTitle: $('meta[name="twitter:title"]').attr("content") || undefined,
    twitterDescription: $('meta[name="twitter:description"]').attr("content") || undefined,
    twitterImage: $('meta[name="twitter:image"]').attr("content") || undefined,
    twitterSite: $('meta[name="twitter:site"]').attr("content") || undefined,
    twitterCreator: $('meta[name="twitter:creator"]').attr("content") || undefined,
    author: $('meta[name="author"]').attr("content") || undefined,
    language: $("html").attr("lang") || undefined,
    themeColor: $('meta[name="theme-color"]').attr("content") || undefined,
  }

  return metaTags
}

function extractImages($: cheerio.CheerioAPI, baseUrl: string): ImageInfo[] {
  return $("img")
    .map((_, img) => {
      const src = $(img).attr("src") || ""
      const absoluteSrc = src.startsWith("http") ? src : new URL(src, baseUrl).toString()

      return {
        src: absoluteSrc,
        alt: $(img).attr("alt") || "",
        hasAlt: $(img).attr("alt") !== undefined,
        width: $(img).attr("width") ? Number.parseInt($(img).attr("width") || "0") : undefined,
        height: $(img).attr("height") ? Number.parseInt($(img).attr("height") || "0") : undefined,
        lazyLoaded: $(img).attr("loading") === "lazy" || $(img).attr("data-src") !== undefined,
      }
    })
    .get()
}

function extractLinks($: cheerio.CheerioAPI, baseUrl: string): LinkInfo[] {
  const baseUrlObj = new URL(baseUrl)
  const origin = baseUrlObj.origin

  return $("a")
    .map((_, link) => {
      const href = $(link).attr("href") || ""
      let absoluteHref = href

      // Handle relative URLs
      if (
        href &&
        !href.startsWith("http") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:") &&
        !href.startsWith("#")
      ) {
        try {
          absoluteHref = new URL(href, origin).toString()
        } catch (e) {
          // Invalid URL, keep as is
        }
      }

      const isInternal =
        href.startsWith("/") ||
        href.startsWith(origin) ||
        !href.includes("://") ||
        (href.includes("://") && new URL(absoluteHref).hostname === baseUrlObj.hostname)

      return {
        href: absoluteHref,
        text: $(link).text().trim(),
        isInternal,
        hasText: $(link).text().trim().length > 0,
        nofollow: $(link).attr("rel")?.includes("nofollow") || false,
        target: $(link).attr("target") || undefined,
      }
    })
    .get()
}

async function checkBrokenLinks(links: LinkInfo[], baseUrl: string): Promise<LinkInfo[]> {
  const brokenLinks: LinkInfo[] = []

  for (const link of links) {
    try {
      if (!link.href || link.href.startsWith("#") || link.href.startsWith("mailto:") || link.href.startsWith("tel:")) {
        continue
      }

      const response = await axios.head(link.href, {
        timeout: 5000,
        validateStatus: () => true, // Accept all status codes
      })

      link.status = response.status

      if (response.status >= 400) {
        brokenLinks.push(link)
      }
    } catch (error) {
      link.status = 0 // Connection error
      brokenLinks.push(link)
    }
  }

  return brokenLinks
}

function extractStructuredData($: cheerio.CheerioAPI): StructuredData[] {
  const structuredData: StructuredData[] = []

  // Look for JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html()
      if (content) {
        const data = JSON.parse(content)
        structuredData.push({
          type: data["@type"] || "Unknown",
          valid: true,
        })
      }
    } catch (e) {
      structuredData.push({
        type: "JSON-LD",
        valid: false,
        errors: [(e as Error).message],
      })
    }
  })

  // Look for microdata
  if ($("[itemscope]").length > 0) {
    structuredData.push({
      type: "Microdata",
      valid: true,
    })
  }

  // Look for RDFa
  if ($("[property][typeof]").length > 0) {
    structuredData.push({
      type: "RDFa",
      valid: true,
    })
  }

  return structuredData
}

function checkSecurity(headers: any, url: string): SecurityInfo {
  const securityHeaders = {
    "Strict-Transport-Security": headers["strict-transport-security"] || null,
    "Content-Security-Policy": headers["content-security-policy"] || null,
    "X-Content-Type-Options": headers["x-content-type-options"] || null,
    "X-Frame-Options": headers["x-frame-options"] || null,
    "X-XSS-Protection": headers["x-xss-protection"] || null,
    "Referrer-Policy": headers["referrer-policy"] || null,
    "Permissions-Policy": headers["permissions-policy"] || null,
  }

  return {
    hasSSL: url.startsWith("https://"),
    hasMixedContent: false, // Would require browser rendering to detect
    securityHeaders,
  }
}

async function checkFileExists(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      validateStatus: () => true,
    })
    return response.status === 200
  } catch (error) {
    return false
  }
}

function extractKeywords(text: string): { word: string; count: number; density: number }[] {
  // Remove common words and punctuation
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "against",
    "between",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "from",
    "up",
    "down",
    "of",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "s",
    "t",
    "can",
    "will",
    "just",
    "don",
    "should",
    "now",
  ])

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word))

  const wordCount = words.length
  const wordFrequency: { [key: string]: number } = {}

  words.forEach((word) => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1
  })

  return Object.entries(wordFrequency)
    .map(([word, count]) => ({
      word,
      count,
      density: (count / wordCount) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20) // Return top 20 keywords
}

function analyzeWebsite(data: WebsiteData): SEOAuditResult {
  const issues: SEOIssue[] = []

  // Title analysis
  analyzeTitleTag(data, issues)

  // Meta description analysis
  analyzeMetaDescription(data, issues)

  // Headings analysis
  analyzeHeadings(data, issues)

  // Images analysis
  analyzeImages(data, issues)

  // Links analysis
  analyzeLinks(data, issues)

  // Content analysis
  analyzeContent(data, issues)

  // Mobile compatibility
  analyzeMobileCompatibility(data, issues)

  // Performance analysis
  analyzePerformance(data, issues)

  // Security analysis
  analyzeSecurity(data, issues)

  // Structured data analysis
  analyzeStructuredData(data, issues)

  // Social media analysis
  analyzeSocialMedia(data, issues)

  // URL structure
  analyzeUrl(data, issues)

  // Technical SEO
  analyzeTechnicalSEO(data, issues)

  // Calculate scores
  const passedChecks = issues.filter((issue) => issue.severity === "good").length
  const warningChecks = issues.filter((issue) => issue.severity === "warning").length
  const errorChecks = issues.filter((issue) => issue.severity === "error").length
  const totalChecks = passedChecks + warningChecks + errorChecks

  // Calculate overall score (0-100)
  const score = Math.round((passedChecks * 100 + warningChecks * 50) / totalChecks)

  // Calculate category scores
  const categories = [...new Set(issues.map((issue) => issue.category))]
  const categoryScores: CategoryScore[] = categories.map((category) => {
    const categoryIssues = issues.filter((issue) => issue.category === category)
    const categoryPassedChecks = categoryIssues.filter((issue) => issue.severity === "good").length
    const categoryWarningChecks = categoryIssues.filter((issue) => issue.severity === "warning").length
    const categoryTotalChecks = categoryIssues.length

    return {
      name: category,
      score: Math.round((categoryPassedChecks * 100 + categoryWarningChecks * 50) / categoryTotalChecks),
      issueCount: categoryIssues.filter((issue) => issue.severity !== "good").length,
    }
  })

  return {
    url: data.url,
    score,
    passedChecks,
    warningChecks,
    errorChecks,
    categoryScores,
    issues,
    timestamp: new Date().toISOString(),
    scanDuration: 0, // Will be set by the API route
    pageTitle: data.title,
  }
}

function analyzeTitleTag(data: WebsiteData, issues: SEOIssue[]) {
  if (!data.title) {
    issues.push({
      title: "Missing page title",
      description: "Your page doesn't have a title tag.",
      severity: "error",
      category: "Meta Tags",
      impact: "high",
      recommendation: "Add a descriptive title tag that includes your main keywords.",
      resourceLinks: [{ title: "Title Tag SEO", url: "https://moz.com/learn/seo/title-tag" }],
    })
  } else if (data.title.length < 10) {
    issues.push({
      title: "Title too short",
      description: `Your title is only ${data.title.length} characters long.`,
      severity: "warning",
      category: "Meta Tags",
      impact: "medium",
      recommendation: "Make your title between 50-60 characters for optimal display in search results.",
      resourceLinks: [{ title: "Title Tag Best Practices", url: "https://moz.com/learn/seo/title-tag" }],
    })
  } else if (data.title.length > 60) {
    issues.push({
      title: "Title too long",
      description: `Your title is ${data.title.length} characters long and may be truncated in search results.`,
      severity: "warning",
      category: "Meta Tags",
      impact: "medium",
      recommendation: "Keep your title under 60 characters to ensure it displays properly in search results.",
      resourceLinks: [{ title: "Title Tag Length", url: "https://moz.com/learn/seo/title-tag" }],
    })
  } else {
    issues.push({
      title: "Good title length",
      description: `Your title is ${data.title.length} characters long, which is optimal.`,
      severity: "good",
      category: "Meta Tags",
    })
  }

  // Check for keyword presence in title
  if (data.title && data.keywords.length > 0) {
    const titleLower = data.title.toLowerCase()
    const keywordInTitle = data.keywords.slice(0, 5).some((keyword) => titleLower.includes(keyword.word.toLowerCase()))

    if (!keywordInTitle) {
      issues.push({
        title: "No primary keywords in title",
        description: "Your title doesn't contain any of your primary keywords.",
        severity: "warning",
        category: "Meta Tags",
        impact: "medium",
        recommendation: "Include your primary keywords in the title tag to improve relevance.",
      })
    } else {
      issues.push({
        title: "Keywords present in title",
        description: "Your title contains keywords that appear frequently in your content.",
        severity: "good",
        category: "Meta Tags",
      })
    }
  }
}

function analyzeMetaDescription(data: WebsiteData, issues: SEOIssue[]) {
  if (!data.metaTags.description) {
    issues.push({
      title: "Missing meta description",
      description: "Your page doesn't have a meta description.",
      severity: "error",
      category: "Meta Tags",
      impact: "high",
      recommendation: "Add a compelling meta description that includes your main keywords.",
      resourceLinks: [{ title: "Meta Description", url: "https://moz.com/learn/seo/meta-description" }],
    })
  } else if (data.metaTags.description.length < 50) {
    issues.push({
      title: "Meta description too short",
      description: `Your meta description is only ${data.metaTags.description.length} characters long.`,
      severity: "warning",
      category: "Meta Tags",
      impact: "medium",
      recommendation: "Make your meta description between 150-160 characters for optimal display in search results.",
      resourceLinks: [{ title: "Meta Description Length", url: "https://moz.com/learn/seo/meta-description" }],
    })
  } else if (data.metaTags.description.length > 160) {
    issues.push({
      title: "Meta description too long",
      description: `Your meta description is ${data.metaTags.description.length} characters long and may be truncated in search results.`,
      severity: "warning",
      category: "Meta Tags",
      impact: "medium",
      recommendation:
        "Keep your meta description under 160 characters to ensure it displays properly in search results.",
      resourceLinks: [{ title: "Meta Description Length", url: "https://moz.com/learn/seo/meta-description" }],
    })
  } else {
    issues.push({
      title: "Good meta description length",
      description: `Your meta description is ${data.metaTags.description.length} characters long, which is optimal.`,
      severity: "good",
      category: "Meta Tags",
    })
  }

  // Check for keyword presence in description
  if (data.metaTags.description && data.keywords.length > 0) {
    const descLower = data.metaTags.description.toLowerCase()
    const keywordInDesc = data.keywords.slice(0, 5).some((keyword) => descLower.includes(keyword.word.toLowerCase()))

    if (!keywordInDesc) {
      issues.push({
        title: "No primary keywords in meta description",
        description: "Your meta description doesn't contain any of your primary keywords.",
        severity: "warning",
        category: "Meta Tags",
        impact: "medium",
        recommendation: "Include your primary keywords in the meta description to improve relevance.",
      })
    } else {
      issues.push({
        title: "Keywords present in meta description",
        description: "Your meta description contains keywords that appear frequently in your content.",
        severity: "good",
        category: "Meta Tags",
      })
    }
  }
}

function analyzeHeadings(data: WebsiteData, issues: SEOIssue[]) {
  if (data.headings.h1.length === 0) {
    issues.push({
      title: "Missing H1 heading",
      description: "Your page doesn't have an H1 heading.",
      severity: "error",
      category: "Content Structure",
      impact: "high",
      recommendation: "Add an H1 heading that includes your main keywords.",
      resourceLinks: [{ title: "Heading Tags in SEO", url: "https://moz.com/learn/seo/on-page-factors" }],
    })
  } else if (data.headings.h1.length > 1) {
    issues.push({
      title: "Multiple H1 headings",
      description: `Your page has ${data.headings.h1.length} H1 headings.`,
      severity: "warning",
      category: "Content Structure",
      impact: "medium",
      recommendation: "Use only one H1 heading per page for optimal SEO.",
      elements: data.headings.h1,
      resourceLinks: [{ title: "H1 Tag Best Practices", url: "https://moz.com/learn/seo/on-page-factors" }],
    })
  } else {
    issues.push({
      title: "Good H1 heading usage",
      description: "Your page has one H1 heading, which is optimal.",
      severity: "good",
      category: "Content Structure",
    })
  }

  // Check heading hierarchy
  const hasH2 = data.headings.h2.length > 0
  const hasH3WithoutH2 = data.headings.h3.length > 0 && data.headings.h2.length === 0
  const hasH4WithoutH3 = data.headings.h4.length > 0 && data.headings.h3.length === 0

  if (hasH3WithoutH2 || hasH4WithoutH3) {
    issues.push({
      title: "Improper heading hierarchy",
      description: "Your page has headings that skip levels in the hierarchy.",
      severity: "warning",
      category: "Content Structure",
      impact: "medium",
      recommendation: "Maintain a proper heading hierarchy (H1 → H2 → H3) without skipping levels.",
      resourceLinks: [
        {
          title: "Heading Hierarchy",
          url: "https://developers.google.com/search/docs/appearance/structured-data/article",
        },
      ],
    })
  }

  // Check if headings contain keywords
  if (data.keywords.length > 0 && data.headings.h1.length > 0) {
    const h1Lower = data.headings.h1[0].toLowerCase()
    const keywordInH1 = data.keywords.slice(0, 5).some((keyword) => h1Lower.includes(keyword.word.toLowerCase()))

    if (!keywordInH1) {
      issues.push({
        title: "No keywords in H1 heading",
        description: "Your H1 heading doesn't contain any of your primary keywords.",
        severity: "warning",
        category: "Content Structure",
        impact: "medium",
        recommendation: "Include your primary keywords in the H1 heading to improve relevance.",
      })
    } else {
      issues.push({
        title: "Keywords present in H1 heading",
        description: "Your H1 heading contains keywords that appear frequently in your content.",
        severity: "good",
        category: "Content Structure",
      })
    }
  }
}

function analyzeImages(data: WebsiteData, issues: SEOIssue[]) {
  const imagesWithoutAlt = data.images.filter((img) => !img.hasAlt)
  if (imagesWithoutAlt.length > 0) {
    issues.push({
      title: "Images missing alt text",
      description: `${imagesWithoutAlt.length} images are missing alt text.`,
      severity: "error",
      category: "Images",
      impact: "high",
      recommendation: "Add descriptive alt text to all images for better accessibility and SEO.",
      elements: imagesWithoutAlt.map((img) => img.src),
      resourceLinks: [{ title: "Image Alt Text", url: "https://moz.com/learn/seo/alt-text" }],
    })
  } else if (data.images.length > 0) {
    issues.push({
      title: "All images have alt text",
      description: "All images on your page have alt text, which is great for accessibility and SEO.",
      severity: "good",
      category: "Images",
    })
  }

  // Check for empty alt text
  const imagesWithEmptyAlt = data.images.filter((img) => img.hasAlt && img.alt.trim() === "")
  if (imagesWithEmptyAlt.length > 0) {
    issues.push({
      title: "Images with empty alt text",
      description: `${imagesWithEmptyAlt.length} images have empty alt text.`,
      severity: "warning",
      category: "Images",
      impact: "medium",
      recommendation: "Add meaningful alt text to images instead of leaving it empty.",
      elements: imagesWithEmptyAlt.map((img) => img.src),
    })
  }

  // Check for missing width and height attributes
  const imagesWithoutDimensions = data.images.filter((img) => img.width === undefined || img.height === undefined)
  if (imagesWithoutDimensions.length > 0 && imagesWithoutDimensions.length > data.images.length / 2) {
    issues.push({
      title: "Images missing dimensions",
      description: `${imagesWithoutDimensions.length} images are missing width and/or height attributes.`,
      severity: "warning",
      category: "Images",
      impact: "low",
      recommendation: "Add width and height attributes to images to prevent layout shifts during page load.",
      elements: imagesWithoutDimensions.slice(0, 5).map((img) => img.src),
    })
  }

  // Check for lazy loading
  const imagesWithoutLazyLoading = data.images.filter((img) => !img.lazyLoaded)
  if (imagesWithoutLazyLoading.length > 0 && data.images.length > 3) {
    issues.push({
      title: "Images not lazy loaded",
      description: `${imagesWithoutLazyLoading.length} images are not using lazy loading.`,
      severity: "warning",
      category: "Performance",
      impact: "medium",
      recommendation:
        "Use lazy loading for images that are not in the initial viewport to improve page load performance.",
      elements: imagesWithoutLazyLoading.slice(0, 5).map((img) => img.src),
    })
  }
}

function analyzeLinks(data: WebsiteData, issues: SEOIssue[]) {
  // Check for links without text
  const linksWithoutText = data.links.filter((link) => !link.hasText)
  if (linksWithoutText.length > 0) {
    issues.push({
      title: "Links missing anchor text",
      description: `${linksWithoutText.length} links are missing anchor text.`,
      severity: "warning",
      category: "Links",
      impact: "medium",
      recommendation: "Add descriptive anchor text to all links for better SEO and accessibility.",
      elements: linksWithoutText.slice(0, 5).map((link) => link.href),
      resourceLinks: [{ title: "Anchor Text", url: "https://moz.com/learn/seo/anchor-text" }],
    })
  }

  // Check for broken links
  if (data.brokenLinks.length > 0) {
    issues.push({
      title: "Broken links detected",
      description: `${data.brokenLinks.length} broken links were found on your page.`,
      severity: "error",
      category: "Links",
      impact: "high",
      recommendation: "Fix or remove broken links to improve user experience and SEO.",
      elements: data.brokenLinks.map((link) => `${link.href} (${link.text || "No text"})`),
    })
  }

  // Check for excessive external links
  const externalLinks = data.links.filter((link) => !link.isInternal)
  if (externalLinks.length > 50) {
    issues.push({
      title: "Excessive external links",
      description: `Your page has ${externalLinks.length} external links, which may dilute link equity.`,
      severity: "warning",
      category: "Links",
      impact: "medium",
      recommendation: "Reduce the number of external links to focus link equity on the most important pages.",
    })
  }

  // Check for internal linking
  const internalLinks = data.links.filter((link) => link.isInternal && !link.href.includes("#"))
  if (internalLinks.length < 3 && data.contentLength > 1000) {
    issues.push({
      title: "Insufficient internal linking",
      description: "Your page has few internal links to other pages on your site.",
      severity: "warning",
      category: "Links",
      impact: "medium",
      recommendation: "Add more internal links to help search engines discover and understand your site structure.",
      resourceLinks: [{ title: "Internal Linking", url: "https://moz.com/learn/seo/internal-link" }],
    })
  } else if (internalLinks.length >= 3) {
    issues.push({
      title: "Good internal linking",
      description: `Your page has ${internalLinks.length} internal links, which helps with site structure and navigation.`,
      severity: "good",
      category: "Links",
    })
  }
}

function analyzeContent(data: WebsiteData, issues: SEOIssue[]) {
  // Check content length
  if (data.wordCount < 300) {
    issues.push({
      title: "Thin content",
      description: `Your page has only ${data.wordCount} words.`,
      severity: "warning",
      category: "Content",
      impact: "high",
      recommendation: "Add more comprehensive content to provide value to users and improve search rankings.",
      resourceLinks: [{ title: "Content Length", url: "https://backlinko.com/seo-content" }],
    })
  } else if (data.wordCount >= 1000) {
    issues.push({
      title: "Good content length",
      description: `Your page has ${data.wordCount} words, which is good for comprehensive coverage.`,
      severity: "good",
      category: "Content",
    })
  }

  // Check keyword density
  if (data.keywords.length > 0) {
    const primaryKeyword = data.keywords[0]
    if (primaryKeyword.density > 5) {
      issues.push({
        title: "Keyword stuffing detected",
        description: `The keyword "${primaryKeyword.word}" appears with a density of ${primaryKeyword.density.toFixed(1)}%, which may be considered keyword stuffing.`,
        severity: "warning",
        category: "Content",
        impact: "high",
        recommendation: "Reduce keyword density to a more natural level (1-2%) to avoid penalties.",
      })
    } else if (primaryKeyword.density < 0.5 && data.wordCount > 300) {
      issues.push({
        title: "Low keyword density",
        description: `Your primary keyword "${primaryKeyword.word}" has a density of only ${primaryKeyword.density.toFixed(1)}%.`,
        severity: "warning",
        category: "Content",
        impact: "medium",
        recommendation: "Increase the usage of your primary keyword to improve relevance.",
      })
    } else if (primaryKeyword.density >= 0.5 && primaryKeyword.density <= 3) {
      issues.push({
        title: "Good keyword density",
        description: `Your primary keyword "${primaryKeyword.word}" has a density of ${primaryKeyword.density.toFixed(1)}%, which is optimal.`,
        severity: "good",
        category: "Content",
      })
    }
  }

  // Check text-to-HTML ratio
  if (data.textToHtmlRatio < 10) {
    issues.push({
      title: "Low text-to-HTML ratio",
      description: `Your page has a text-to-HTML ratio of ${data.textToHtmlRatio.toFixed(1)}%.`,
      severity: "warning",
      category: "Content",
      impact: "medium",
      recommendation: "Increase the amount of visible text relative to HTML code for better SEO.",
    })
  } else if (data.textToHtmlRatio >= 25) {
    issues.push({
      title: "Good text-to-HTML ratio",
      description: `Your page has a text-to-HTML ratio of ${data.textToHtmlRatio.toFixed(1)}%, which is good.`,
      severity: "good",
      category: "Content",
    })
  }
}

function analyzeMobileCompatibility(data: WebsiteData, issues: SEOIssue[]) {
  if (!data.mobileCompatible) {
    issues.push({
      title: "Not mobile-friendly",
      description: "Your website doesn't have a proper viewport meta tag for mobile devices.",
      severity: "error",
      category: "Mobile",
      impact: "high",
      recommendation: "Add a viewport meta tag to make your website mobile-friendly.",
      resourceLinks: [{ title: "Mobile-Friendly Test", url: "https://search.google.com/test/mobile-friendly" }],
    })
  } else {
    issues.push({
      title: "Mobile-friendly",
      description: "Your website has a proper viewport meta tag for mobile devices.",
      severity: "good",
      category: "Mobile",
    })
  }
}

function analyzePerformance(data: WebsiteData, issues: SEOIssue[]) {
  // Check page load time
  if (data.performance.loadTime > 3000) {
    issues.push({
      title: "Slow page load time",
      description: `Your page takes ${(data.performance.loadTime / 1000).toFixed(2)} seconds to load.`,
      severity: "error",
      category: "Performance",
      impact: "high",
      recommendation:
        "Optimize your page to load faster by compressing images, minifying CSS and JavaScript, and using browser caching.",
      resourceLinks: [{ title: "Page Speed", url: "https://developers.google.com/speed/pagespeed/insights/" }],
    })
  } else if (data.performance.loadTime > 1500) {
    issues.push({
      title: "Moderate page load time",
      description: `Your page takes ${(data.performance.loadTime / 1000).toFixed(2)} seconds to load.`,
      severity: "warning",
      category: "Performance",
      impact: "medium",
      recommendation: "Further optimize your page to load faster for better user experience and SEO.",
    })
  } else {
    issues.push({
      title: "Good page load time",
      description: `Your page loads in ${(data.performance.loadTime / 1000).toFixed(2)} seconds, which is good.`,
      severity: "good",
      category: "Performance",
    })
  }

  // Check CSS and JS files
  if (data.cssFiles.length > 10) {
    issues.push({
      title: "Too many CSS files",
      description: `Your page loads ${data.cssFiles.length} CSS files.`,
      severity: "warning",
      category: "Performance",
      impact: "medium",
      recommendation: "Combine CSS files to reduce HTTP requests and improve load time.",
    })
  }

  if (data.jsFiles.length > 15) {
    issues.push({
      title: "Too many JavaScript files",
      description: `Your page loads ${data.jsFiles.length} JavaScript files.`,
      severity: "warning",
      category: "Performance",
      impact: "medium",
      recommendation: "Combine JavaScript files to reduce HTTP requests and improve load time.",
    })
  }
}

function analyzeSecurity(data: WebsiteData, issues: SEOIssue[]) {
  if (!data.security.hasSSL) {
    issues.push({
      title: "Missing SSL certificate",
      description: "Your website is not using HTTPS.",
      severity: "error",
      category: "Security",
      impact: "high",
      recommendation: "Install an SSL certificate to secure your website and improve search rankings.",
      resourceLinks: [
        {
          title: "HTTPS as a ranking signal",
          url: "https://developers.google.com/search/blog/2014/08/https-as-ranking-signal",
        },
      ],
    })
  } else {
    issues.push({
      title: "SSL certificate installed",
      description: "Your website is using HTTPS, which is good for security and SEO.",
      severity: "good",
      category: "Security",
    })
  }

  // Check security headers
  const missingSecurityHeaders = Object.entries(data.security.securityHeaders)
    .filter(([_, value]) => value === null)
    .map(([key, _]) => key)

  if (missingSecurityHeaders.length > 3) {
    issues.push({
      title: "Missing security headers",
      description: `Your website is missing important security headers.`,
      severity: "warning",
      category: "Security",
      impact: "medium",
      recommendation: "Add security headers to protect your website from common attacks.",
      elements: missingSecurityHeaders,
    })
  }
}

function analyzeStructuredData(data: WebsiteData, issues: SEOIssue[]) {
  if (data.structuredData.length === 0) {
    issues.push({
      title: "No structured data",
      description: "Your page doesn't have any structured data markup.",
      severity: "warning",
      category: "Structured Data",
      impact: "medium",
      recommendation: "Add structured data markup to help search engines understand your content better.",
      resourceLinks: [
        {
          title: "Structured Data",
          url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
        },
      ],
    })
  } else {
    const invalidStructuredData = data.structuredData.filter((sd) => !sd.valid)
    if (invalidStructuredData.length > 0) {
      issues.push({
        title: "Invalid structured data",
        description: `Your page has ${invalidStructuredData.length} invalid structured data items.`,
        severity: "warning",
        category: "Structured Data",
        impact: "medium",
        recommendation: "Fix the errors in your structured data markup.",
        elements: invalidStructuredData.map((sd) => sd.type),
      })
    } else {
      issues.push({
        title: "Valid structured data",
        description: `Your page has ${data.structuredData.length} valid structured data items.`,
        severity: "good",
        category: "Structured Data",
      })
    }
  }
}

function analyzeSocialMedia(data: WebsiteData, issues: SEOIssue[]) {
  // Check Open Graph tags
  const hasOgTitle = !!data.metaTags.ogTitle
  const hasOgDescription = !!data.metaTags.ogDescription
  const hasOgImage = !!data.metaTags.ogImage

  if (!hasOgTitle && !hasOgDescription && !hasOgImage) {
    issues.push({
      title: "Missing Open Graph tags",
      description: "Your page doesn't have Open Graph tags for social media sharing.",
      severity: "warning",
      category: "Social Media",
      impact: "medium",
      recommendation: "Add Open Graph tags to control how your content appears when shared on social media.",
      resourceLinks: [{ title: "Open Graph Protocol", url: "https://ogp.me/" }],
    })
  } else if (!hasOgTitle || !hasOgDescription || !hasOgImage) {
    issues.push({
      title: "Incomplete Open Graph tags",
      description: "Your page is missing some Open Graph tags for optimal social media sharing.",
      severity: "warning",
      category: "Social Media",
      impact: "low",
      recommendation: "Add all essential Open Graph tags (title, description, image) for better social media sharing.",
      elements: [
        !hasOgTitle ? "og:title" : null,
        !hasOgDescription ? "og:description" : null,
        !hasOgImage ? "og:image" : null,
      ].filter(Boolean) as string[],
    })
  } else {
    issues.push({
      title: "Complete Open Graph tags",
      description: "Your page has all essential Open Graph tags for social media sharing.",
      severity: "good",
      category: "Social Media",
    })
  }

  // Check Twitter Card tags
  const hasTwitterCard = !!data.metaTags.twitterCard
  const hasTwitterTitle = !!data.metaTags.twitterTitle
  const hasTwitterDescription = !!data.metaTags.twitterDescription
  const hasTwitterImage = !!data.metaTags.twitterImage

  if (!hasTwitterCard) {
    issues.push({
      title: "Missing Twitter Card",
      description: "Your page doesn't have Twitter Card tags for Twitter sharing.",
      severity: "warning",
      category: "Social Media",
      impact: "low",
      recommendation: "Add Twitter Card tags to control how your content appears when shared on Twitter.",
      resourceLinks: [
        {
          title: "Twitter Cards",
          url: "https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards",
        },
      ],
    })
  } else if (!hasTwitterTitle || !hasTwitterDescription || !hasTwitterImage) {
    issues.push({
      title: "Incomplete Twitter Card tags",
      description: "Your page is missing some Twitter Card tags for optimal Twitter sharing.",
      severity: "warning",
      category: "Social Media",
      impact: "low",
      recommendation: "Add all essential Twitter Card tags for better Twitter sharing.",
    })
  } else {
    issues.push({
      title: "Complete Twitter Card tags",
      description: "Your page has all essential Twitter Card tags for Twitter sharing.",
      severity: "good",
      category: "Social Media",
    })
  }
}

function analyzeUrl(data: WebsiteData, issues: SEOIssue[]) {
  const url = new URL(data.url)

  // Check URL length
  if (url.pathname.length > 100) {
    issues.push({
      title: "URL too long",
      description: `Your URL path is ${url.pathname.length} characters long.`,
      severity: "warning",
      category: "URL Structure",
      impact: "low",
      recommendation: "Use shorter, more descriptive URLs for better user experience and SEO.",
    })
  }

  // Check for URL parameters
  if (url.search.length > 0) {
    const paramCount = url.searchParams.size
    if (paramCount > 2) {
      issues.push({
        title: "Too many URL parameters",
        description: `Your URL has ${paramCount} parameters, which may cause crawling issues.`,
        severity: "warning",
        category: "URL Structure",
        impact: "medium",
        recommendation: "Minimize URL parameters or use URL rewriting to create cleaner URLs.",
      })
    }
  }

  // Check for canonical URL
  if (!data.metaTags.canonical) {
    issues.push({
      title: "Missing canonical tag",
      description: "Your page doesn't have a canonical tag.",
      severity: "warning",
      category: "URL Structure",
      impact: "medium",
      recommendation: "Add a canonical tag to prevent duplicate content issues.",
      resourceLinks: [
        {
          title: "Canonical URLs",
          url: "https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls",
        },
      ],
    })
  } else if (data.metaTags.canonical !== data.url && !data.redirectChain.includes(data.metaTags.canonical)) {
    issues.push({
      title: "Non-matching canonical URL",
      description: "The canonical URL doesn't match the current URL.",
      severity: "warning",
      category: "URL Structure",
      impact: "medium",
      recommendation: "Ensure the canonical URL matches the current URL unless intentionally pointing to another page.",
      elements: [data.metaTags.canonical],
    })
  } else if (data.metaTags.canonical === data.url) {
    issues.push({
      title: "Proper canonical tag",
      description: "Your page has a proper canonical tag pointing to the current URL.",
      severity: "good",
      category: "URL Structure",
    })
  }
}

function analyzeTechnicalSEO(data: WebsiteData, issues: SEOIssue[]) {
  // Check for robots meta tag
  if (data.metaTags.robots && (data.metaTags.robots.includes("noindex") || data.metaTags.robots.includes("none"))) {
    issues.push({
      title: "Page set to noindex",
      description: "Your page has a robots meta tag that prevents indexing.",
      severity: "error",
      category: "Technical SEO",
      impact: "high",
      recommendation: "Remove the noindex directive if you want this page to be indexed by search engines.",
    })
  } else if (!data.metaTags.robots) {
    issues.push({
      title: "Missing robots meta tag",
      description: "Your page doesn't have a robots meta tag.",
      severity: "warning",
      category: "Technical SEO",
      impact: "low",
      recommendation: "Add a robots meta tag to explicitly control how search engines should handle your page.",
    })
  } else {
    issues.push({
      title: "Proper robots meta tag",
      description: "Your page has a robots meta tag that allows indexing.",
      severity: "good",
      category: "Technical SEO",
    })
  }

  // Check for sitemap
  if (!data.hasSitemap) {
    issues.push({
      title: "Missing sitemap",
      description: "Your website doesn't have a sitemap.xml file.",
      severity: "warning",
      category: "Technical SEO",
      impact: "medium",
      recommendation: "Create a sitemap.xml file to help search engines discover and index your pages.",
      resourceLinks: [
        { title: "Sitemaps", url: "https://developers.google.com/search/docs/advanced/sitemaps/overview" },
      ],
    })
  } else {
    issues.push({
      title: "Sitemap found",
      description: "Your website has a sitemap.xml file.",
      severity: "good",
      category: "Technical SEO",
    })
  }

  // Check for robots.txt
  if (!data.hasRobotsTxt) {
    issues.push({
      title: "Missing robots.txt",
      description: "Your website doesn't have a robots.txt file.",
      severity: "warning",
      category: "Technical SEO",
      impact: "medium",
      recommendation: "Create a robots.txt file to control which parts of your site search engines can crawl.",
      resourceLinks: [{ title: "Robots.txt", url: "https://developers.google.com/search/docs/advanced/robots/intro" }],
    })
  } else {
    issues.push({
      title: "Robots.txt found",
      description: "Your website has a robots.txt file.",
      severity: "good",
      category: "Technical SEO",
    })
  }

  // Check for redirects
  if (data.redirectChain.length > 0) {
    issues.push({
      title: "URL has redirects",
      description: `Your URL goes through ${data.redirectChain.length} redirect(s) before reaching the final page.`,
      severity: "warning",
      category: "Technical SEO",
      impact: "medium",
      recommendation: "Minimize redirects to improve page load time and preserve link equity.",
      elements: data.redirectChain,
    })
  }

  // Check for language declaration
  if (!data.metaTags.language) {
    issues.push({
      title: "Missing language declaration",
      description: "Your page doesn't specify a language in the HTML tag.",
      severity: "warning",
      category: "Technical SEO",
      impact: "low",
      recommendation:
        "Add a lang attribute to the HTML tag to help search engines understand the language of your content.",
    })
  } else {
    issues.push({
      title: "Language declared",
      description: `Your page declares ${data.metaTags.language} as its language.`,
      severity: "good",
      category: "Technical SEO",
    })
  }
}

