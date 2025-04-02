import { type NextRequest, NextResponse } from "next/server"
import { load } from "cheerio"
import axios from "axios"
import { parse as parseUrl } from "url"

// Helper function to fetch a URL
async function fetchUrl(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "SEOAuditBot/1.0 (+https://seoaudit.example.com)",
      },
      timeout: 10000,
    })
    return response
  } catch (error) {
    console.error(`Error fetching URL: ${url}`, error)
    throw error
  }
}

// Extract meta tags
function extractMetaTags(html: string) {
  const $ = load(html)
  const metaTags = {
    title: $("title").text(),
    description: $('meta[name="description"]').attr("content") || "",
    keywords: $('meta[name="keywords"]').attr("content") || "",
    viewport: $('meta[name="viewport"]').attr("content") || "",
    robots: $('meta[name="robots"]').attr("content") || "",
    canonical: $('link[rel="canonical"]').attr("href") || "",
  }

  return metaTags
}

// Analyze heading structure
function analyzeHeadingStructure(html: string) {
  const $ = load(html)
  const headings = {
    h1: $("h1").length,
    h2: $("h2").length,
    h3: $("h3").length,
    h4: $("h4").length,
    h5: $("h5").length,
    h6: $("h6").length,
    h1Text: $("h1")
      .map((i, el) => $(el).text().trim())
      .get(),
  }

  const issues = []
  if (headings.h1 === 0) {
    issues.push("No H1 heading found")
  } else if (headings.h1 > 1) {
    issues.push("Multiple H1 headings found")
  }

  return { headings, issues }
}

// Analyze content
function analyzeContent(html: string) {
  const $ = load(html)
  const bodyText = $("body").text().trim()
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length
  const paragraphs = $("p").length

  const contentAnalysis = {
    wordCount,
    paragraphs,
    contentToCodeRatio: bodyText.length / html.length,
  }

  const issues = []
  if (wordCount < 300) {
    issues.push("Content is too short (less than 300 words)")
  }

  return { contentAnalysis, issues }
}

// Analyze URL structure
function analyzeUrl(url: string) {
  const parsedUrl = parseUrl(url)
  const pathSegments = parsedUrl.pathname?.split("/").filter(Boolean) || []

  const urlAnalysis = {
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname,
    pathSegments,
    pathLength: parsedUrl.pathname?.length || 0,
    hasQueryParams: !!parsedUrl.query,
    queryParams: parsedUrl.query,
  }

  const issues = []
  if (urlAnalysis.pathLength > 100) {
    issues.push("URL path is too long")
  }
  if (urlAnalysis.hasQueryParams) {
    issues.push("URL contains query parameters")
  }

  return { urlAnalysis, issues }
}

// Analyze images
function analyzeImages(html: string, baseUrl: string) {
  const $ = load(html)
  const images = $("img")
    .map((i, el) => {
      const img = $(el)
      return {
        src: img.attr("src") || "",
        alt: img.attr("alt") || "",
        width: img.attr("width") || "",
        height: img.attr("height") || "",
        hasAlt: !!img.attr("alt"),
        hasWidthHeight: !!(img.attr("width") && img.attr("height")),
      }
    })
    .get()

  const issues = []
  const imagesWithoutAlt = images.filter((img) => !img.hasAlt)
  if (imagesWithoutAlt.length > 0) {
    issues.push(`${imagesWithoutAlt.length} images missing alt text`)
  }

  const imagesWithoutDimensions = images.filter((img) => !img.hasWidthHeight)
  if (imagesWithoutDimensions.length > 0) {
    issues.push(`${imagesWithoutDimensions.length} images missing width/height attributes`)
  }

  return { images, issues }
}

// Analyze social media tags
function analyzeSocialTags(html: string) {
  const $ = load(html)

  const openGraph = {
    title: $('meta[property="og:title"]').attr("content") || "",
    description: $('meta[property="og:description"]').attr("content") || "",
    image: $('meta[property="og:image"]').attr("content") || "",
    url: $('meta[property="og:url"]').attr("content") || "",
    type: $('meta[property="og:type"]').attr("content") || "",
  }

  const twitter = {
    card: $('meta[name="twitter:card"]').attr("content") || "",
    title: $('meta[name="twitter:title"]').attr("content") || "",
    description: $('meta[name="twitter:description"]').attr("content") || "",
    image: $('meta[name="twitter:image"]').attr("content") || "",
  }

  const issues = []
  if (!openGraph.title && !openGraph.description) {
    issues.push("Missing Open Graph tags")
  }
  if (!twitter.card && !twitter.title) {
    issues.push("Missing Twitter Card tags")
  }

  return { openGraph, twitter, issues }
}

// Define an interface for the schema object
interface SchemaMarkup {
  type: string
  content: string
}

// Update the function to use the typed array
function analyzeSchemaMarkup(html: string) {
  const $ = load(html)
  const schemas: SchemaMarkup[] = []

  // Look for JSON-LD schema
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const schema = JSON.parse($(el).html() || "{}")
      schemas.push({
        type: "json-ld",
        content: schema["@type"] || "Unknown",
      })
    } catch (e) {
      console.error("Error parsing JSON-LD schema", e)
    }
  })

  // Look for microdata schema
  $("[itemtype]").each((i, el) => {
    schemas.push({
      type: "microdata",
      content: $(el).attr("itemtype") || "Unknown",
    })
  })

  // Look for RDFa schema
  $("[typeof]").each((i, el) => {
    schemas.push({
      type: "rdfa",
      content: $(el).attr("typeof") || "Unknown",
    })
  })

  const issues: string[] = []
  if (schemas.length === 0) {
    issues.push("No schema markup detected")
  }

  return { schemas, issues }
}

// Analyze internal links
function analyzeInternalLinks(html: string, baseUrl: string) {
  const $ = load(html)
  const hostname = parseUrl(baseUrl).hostname

  const internalLinks = $("a[href]")
    .map((i, el) => {
      const href = $(el).attr("href") || ""
      let fullUrl = href

      // Handle relative URLs
      if (href.startsWith("/")) {
        fullUrl = `${parseUrl(baseUrl).protocol}//${hostname}${href}`
      } else if (!href.startsWith("http")) {
        fullUrl = `${baseUrl.replace(/\/$/, "")}/${href.replace(/^\//, "")}`
      }

      const isInternal = fullUrl.includes(hostname)
      if (!isInternal) return null

      return {
        text: $(el).text().trim(),
        url: fullUrl,
        isNofollow: $(el).attr("rel")?.includes("nofollow") || false,
      }
    })
    .get()
    .filter(Boolean)

  const issues = []
  if (internalLinks.length === 0) {
    issues.push("No internal links found")
  }

  return { internalLinks, issues }
}

// Analyze external links
function analyzeExternalLinks(html: string, baseUrl: string) {
  const $ = load(html)
  const hostname = parseUrl(baseUrl).hostname

  const externalLinks = $("a[href]")
    .map((i, el) => {
      const href = $(el).attr("href") || ""
      if (!href.startsWith("http")) return null

      const linkHostname = parseUrl(href).hostname
      if (!linkHostname || linkHostname === hostname) return null

      return {
        text: $(el).text().trim(),
        url: href,
        isNofollow: $(el).attr("rel")?.includes("nofollow") || false,
        hasExternalIndicator: $(el).attr("target") === "_blank",
      }
    })
    .get()
    .filter(Boolean)

  const issues = []
  const externalLinksWithoutNofollow = externalLinks.filter((link) => !link.isNofollow)
  if (externalLinksWithoutNofollow.length > 0) {
    issues.push(`${externalLinksWithoutNofollow.length} external links without nofollow`)
  }

  return { externalLinks, issues }
}

// Check for mobile-friendliness
function analyzeMobileFriendliness(html: string) {
  const $ = load(html)

  const viewportTag = $('meta[name="viewport"]').attr("content") || ""
  const hasMobileViewport = viewportTag.includes("width=device-width")

  const touchElements = $("a, button, input, select, textarea").length
  const smallTouchElements = $("a, button").filter((i, el) => {
    const width = $(el).css("width")
    const height = $(el).css("height")
    // Check if dimensions are specified and less than recommended touch target size
    return (width && Number.parseInt(width) < 44) || (height && Number.parseInt(height) < 44)
  }).length

  const issues = []
  if (!hasMobileViewport) {
    issues.push("No mobile viewport meta tag")
  }
  if (smallTouchElements > 0) {
    issues.push(`${smallTouchElements} touch elements may be too small for mobile users`)
  }

  return {
    hasMobileViewport,
    viewportTag,
    touchElements,
    smallTouchElements,
    issues,
  }
}

// Check for HTTPS security
function analyzeHttps(url: string) {
  const isHttps = url.startsWith("https://")

  const issues = []
  if (!isHttps) {
    issues.push("Website is not using HTTPS")
  }

  return {
    isHttps,
    issues,
  }
}

// Analyze page performance (basic metrics)
function analyzePerformance(html: string) {
  const $ = load(html)

  // Count resources
  const scripts = $("script").length
  const styles = $('link[rel="stylesheet"]').length
  const inlineStyles = $("style").length
  const images = $("img").length

  // Estimate page weight
  const htmlSize = html.length

  const issues = []
  if (scripts > 15) {
    issues.push(`High number of script tags (${scripts})`)
  }
  if (styles + inlineStyles > 10) {
    issues.push(`High number of stylesheets (${styles + inlineStyles})`)
  }
  if (htmlSize > 100000) {
    issues.push(`Large HTML size (${Math.round(htmlSize / 1024)} KB)`)
  }

  return {
    resourceCounts: {
      scripts,
      styles,
      inlineStyles,
      images,
    },
    htmlSize,
    issues,
  }
}

// Analyze keyword usage
function analyzeKeywords(html: string, url: string) {
  const $ = load(html)

  // Extract potential keywords from meta tags
  const metaKeywords = $('meta[name="keywords"]').attr("content") || ""
  const metaDescription = $('meta[name="description"]').attr("content") || ""

  // Extract text content
  const title = $("title").text()
  const h1Text = $("h1").text()
  const bodyText = $("body").text().trim()

  // Simple keyword extraction (this could be much more sophisticated)
  const extractedKeywords = new Set<string>()

  // Add keywords from meta tags
  if (metaKeywords) {
    metaKeywords.split(",").forEach((keyword) => {
      extractedKeywords.add(keyword.trim().toLowerCase())
    })
  }

  // Extract potential keywords from title and h1
  const titleWords = title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)
  const h1Words = h1Text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)

  titleWords.forEach((word) => extractedKeywords.add(word))
  h1Words.forEach((word) => extractedKeywords.add(word))

  // Count keyword occurrences in body
  const keywordDensity: Record<string, number> = {}
  Array.from(extractedKeywords).forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi")
    const matches = bodyText.match(regex)
    keywordDensity[keyword] = matches ? matches.length : 0
  })

  // Check if keywords appear in important places
  const keywordAnalysis = Array.from(extractedKeywords).map((keyword) => {
    return {
      keyword,
      inTitle: title.toLowerCase().includes(keyword),
      inH1: h1Text.toLowerCase().includes(keyword),
      inUrl: url.toLowerCase().includes(keyword),
      inMetaDescription: metaDescription.toLowerCase().includes(keyword),
      occurrences: keywordDensity[keyword] || 0,
      density: bodyText.length > 0 ? (keywordDensity[keyword] || 0) / bodyText.split(/\s+/).length : 0,
    }
  })

  const issues = []
  keywordAnalysis.forEach((analysis) => {
    if (analysis.density > 0.05) {
      issues.push(`Keyword "${analysis.keyword}" may be overused (${(analysis.density * 100).toFixed(1)}%)`)
    }
    if (analysis.occurrences > 0 && !analysis.inTitle && !analysis.inH1) {
      issues.push(`Keyword "${analysis.keyword}" not found in title or H1`)
    }
  })

  return {
    keywordAnalysis,
    issues,
  }
}

// Check for canonical issues
function analyzeCanonical(html: string, url: string) {
  const $ = load(html)

  const canonicalUrl = $('link[rel="canonical"]').attr("href") || ""
  const hasCanonical = !!canonicalUrl
  const isCanonicalSelf = canonicalUrl === url

  const issues = []
  if (!hasCanonical) {
    issues.push("No canonical URL specified")
  } else if (!isCanonicalSelf) {
    issues.push("Canonical URL points to a different page")
  }

  return {
    hasCanonical,
    canonicalUrl,
    isCanonicalSelf,
    issues,
  }
}

// Check for hreflang tags
function analyzeHreflang(html: string) {
  const $ = load(html)

  const hreflangTags = $('link[rel="alternate"][hreflang]')
    .map((i, el) => {
      return {
        hreflang: $(el).attr("hreflang") || "",
        href: $(el).attr("href") || "",
      }
    })
    .get()

  const hasHreflang = hreflangTags.length > 0

  const issues = []
  if (hreflangTags.length > 0) {
    const selfReference = hreflangTags.find((tag) => tag.hreflang === "x-default")
    if (!selfReference) {
      issues.push("Missing x-default hreflang tag")
    }
  }

  return {
    hasHreflang,
    hreflangTags,
    issues,
  }
}

// Check for robots.txt
async function analyzeRobotsTxt(baseUrl: string) {
  try {
    const robotsUrl = `${baseUrl.replace(/\/$/, "")}/robots.txt`
    const response = await axios.get(robotsUrl, { timeout: 5000 })

    const hasRobotsTxt = response.status === 200
    const robotsTxtContent = hasRobotsTxt ? response.data : ""

    const issues = []
    if (!hasRobotsTxt) {
      issues.push("No robots.txt file found")
    } else if (robotsTxtContent.includes("Disallow: /")) {
      issues.push("robots.txt contains disallow rules")
    }

    return {
      hasRobotsTxt,
      robotsTxtContent,
      issues,
    }
  } catch (error) {
    return {
      hasRobotsTxt: false,
      robotsTxtContent: "",
      issues: ["Failed to fetch robots.txt"],
    }
  }
}

// Check for sitemap.xml
async function analyzeSitemap(baseUrl: string) {
  try {
    const sitemapUrl = `${baseUrl.replace(/\/$/, "")}/sitemap.xml`
    const response = await axios.get(sitemapUrl, { timeout: 5000 })

    const hasSitemap = response.status === 200

    // Simple check if it looks like XML
    const isValidXml = hasSitemap && response.data.includes("<?xml")

    const issues = []
    if (!hasSitemap) {
      issues.push("No sitemap.xml file found")
    } else if (!isValidXml) {
      issues.push("sitemap.xml does not appear to be valid XML")
    }

    return {
      hasSitemap,
      sitemapUrl,
      isValidXml,
      issues,
    }
  } catch (error) {
    return {
      hasSitemap: false,
      sitemapUrl: `${baseUrl.replace(/\/$/, "")}/sitemap.xml`,
      isValidXml: false,
      issues: ["Failed to fetch sitemap.xml"],
    }
  }
}

// Calculate readability score (Flesch-Kincaid)
function calculateReadability(html: string) {
  const $ = load(html)

  // Extract text content
  const paragraphs = $("p")
    .map((i, el) => $(el).text().trim())
    .get()
  const text = paragraphs.join(" ")

  // Count sentences, words, and syllables
  const sentences = text.split(/[.!?]+/).filter(Boolean).length
  const words = text.split(/\s+/).filter(Boolean).length

  // Simple syllable counter (this is a basic approximation)
  const countSyllables = (word: string) => {
    word = word.toLowerCase()
    if (word.length <= 3) return 1

    // Remove ending e
    word = word.replace(/e$/, "")

    // Count vowel groups
    const vowelGroups = word.match(/[aeiouy]+/g)
    return vowelGroups ? vowelGroups.length : 1
  }

  const syllables = text
    .split(/\s+/)
    .filter(Boolean)
    .reduce((total, word) => {
      return total + countSyllables(word)
    }, 0)

  // Calculate Flesch-Kincaid Reading Ease
  let readabilityScore = 0
  if (sentences > 0 && words > 0) {
    readabilityScore = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  }

  // Interpret score
  let readabilityLevel = ""
  if (readabilityScore >= 90) readabilityLevel = "Very Easy"
  else if (readabilityScore >= 80) readabilityLevel = "Easy"
  else if (readabilityScore >= 70) readabilityLevel = "Fairly Easy"
  else if (readabilityScore >= 60) readabilityLevel = "Standard"
  else if (readabilityScore >= 50) readabilityLevel = "Fairly Difficult"
  else if (readabilityScore >= 30) readabilityLevel = "Difficult"
  else readabilityLevel = "Very Difficult"

  const issues = []
  if (readabilityScore < 60) {
    issues.push(`Content may be difficult to read (score: ${readabilityScore.toFixed(1)})`)
  }

  return {
    readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
    readabilityLevel,
    textStats: {
      sentences,
      words,
      syllables,
      averageWordsPerSentence: sentences > 0 ? words / sentences : 0,
      averageSyllablesPerWord: words > 0 ? syllables / words : 0,
    },
    issues,
  }
}

// Check for broken links
async function checkBrokenLinks(html: string, baseUrl: string) {
  const $ = load(html)
  const hostname = parseUrl(baseUrl).hostname

  // Get all links
  const links = $("a[href]")
    .map((i, el) => {
      const href = $(el).attr("href") || ""

      // Skip anchors, javascript, mailto, tel links
      if (
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return null
      }

      // Handle relative URLs
      let fullUrl = href
      if (href.startsWith("/")) {
        fullUrl = `${parseUrl(baseUrl).protocol}//${hostname}${href}`
      } else if (!href.startsWith("http")) {
        fullUrl = `${baseUrl.replace(/\/$/, "")}/${href.replace(/^\//, "")}`
      }

      return {
        text: $(el).text().trim() || "[No Text]",
        url: fullUrl,
      }
    })
    .get()
    .filter(Boolean)

  // Limit to first 10 links to avoid too many requests
  const linksToCheck = links.slice(0, 10)

  // Check each link
  const brokenLinks = []
  for (const link of linksToCheck) {
    try {
      const response = await axios.head(link.url, {
        timeout: 5000,
        validateStatus: () => true, // Accept any status code
      })

      if (response.status >= 400) {
        brokenLinks.push({
          ...link,
          status: response.status,
        })
      }
    } catch (error) {
      brokenLinks.push({
        ...link,
        status: "Error",
        error: error.message,
      })
    }
  }

  const issues = []
  if (brokenLinks.length > 0) {
    issues.push(`${brokenLinks.length} broken links found`)
  }

  return {
    checkedLinks: linksToCheck.length,
    brokenLinks,
    issues,
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch (error) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Fetch the URL
    const response = await fetchUrl(url)
    const html = response.data

    // Run all analyses
    const metaTags = extractMetaTags(html)
    const { headings, issues: headingIssues } = analyzeHeadingStructure(html)
    const { contentAnalysis, issues: contentIssues } = analyzeContent(html)
    const { urlAnalysis, issues: urlIssues } = analyzeUrl(url)
    const { images, issues: imageIssues } = analyzeImages(html, url)
    const { openGraph, twitter, issues: socialIssues } = analyzeSocialTags(html)
    const { schemas, issues: schemaIssues } = analyzeSchemaMarkup(html)
    const { internalLinks, issues: internalLinkIssues } = analyzeInternalLinks(html, url)
    const { externalLinks, issues: externalLinkIssues } = analyzeExternalLinks(html, url)
    const mobileFriendliness = analyzeMobileFriendliness(html)
    const httpsAnalysis = analyzeHttps(url)
    const performance = analyzePerformance(html)
    const { keywordAnalysis, issues: keywordIssues } = analyzeKeywords(html, url)
    const canonicalAnalysis = analyzeCanonical(html, url)
    const hreflangAnalysis = analyzeHreflang(html)
    const readability = calculateReadability(html)

    // Async checks (these could be run in parallel with Promise.all for better performance)
    const robotsTxtAnalysis = await analyzeRobotsTxt(url)
    const sitemapAnalysis = await analyzeSitemap(url)
    const { brokenLinks, issues: brokenLinkIssues } = await checkBrokenLinks(html, url)

    // Combine all issues
    const allIssues = [
      ...headingIssues,
      ...contentIssues,
      ...urlIssues,
      ...imageIssues,
      ...socialIssues,
      ...schemaIssues,
      ...internalLinkIssues,
      ...externalLinkIssues,
      ...mobileFriendliness.issues,
      ...httpsAnalysis.issues,
      ...performance.issues,
      ...keywordIssues,
      ...canonicalAnalysis.issues,
      ...hreflangAnalysis.issues,
      ...robotsTxtAnalysis.issues,
      ...sitemapAnalysis.issues,
      ...readability.issues,
      ...brokenLinkIssues,
    ]

    // Calculate overall score
    const maxScore = 100
    const deductions = Math.min(allIssues.length * 3, 70) // Cap deductions at 70 points
    const overallScore = Math.max(0, maxScore - deductions)

    // Categorize issues by severity
    const criticalIssues = allIssues.filter(
      (issue) => issue.includes("No H1") || issue.includes("broken links") || issue.includes("not using HTTPS"),
    )

    const majorIssues = allIssues.filter(
      (issue) =>
        !criticalIssues.includes(issue) &&
        (issue.includes("missing") ||
          issue.includes("too short") ||
          issue.includes("too long") ||
          issue.includes("High number")),
    )

    const minorIssues = allIssues.filter((issue) => !criticalIssues.includes(issue) && !majorIssues.includes(issue))

    // Prepare recommendations
    const recommendations = []

    if (criticalIssues.length > 0) {
      recommendations.push("Fix critical issues first, especially related to broken links, missing H1 tags, and HTTPS.")
    }

    if (!metaTags.description) {
      recommendations.push("Add a meta description to improve click-through rates from search results.")
    }

    if (headings.h1 !== 1) {
      recommendations.push("Ensure your page has exactly one H1 tag that contains your primary keyword.")
    }

    if (contentAnalysis.wordCount < 300) {
      recommendations.push("Increase content length to at least 300 words for better search engine visibility.")
    }

    if (imageIssues.length > 0) {
      recommendations.push(
        "Add alt text to all images and specify width/height attributes to improve page loading performance.",
      )
    }

    if (socialIssues.length > 0) {
      recommendations.push("Add Open Graph and Twitter Card meta tags to improve social media sharing appearance.")
    }

    if (schemaIssues.length > 0) {
      recommendations.push("Implement schema markup to help search engines understand your content better.")
    }

    if (!canonicalAnalysis.hasCanonical) {
      recommendations.push("Add a canonical tag to prevent duplicate content issues.")
    }

    if (!mobileFriendliness.hasMobileViewport) {
      recommendations.push("Add a proper viewport meta tag to ensure mobile-friendliness.")
    }

    if (!httpsAnalysis.isHttps) {
      recommendations.push("Switch to HTTPS to improve security and search engine rankings.")
    }

    if (performance.issues.length > 0) {
      recommendations.push("Optimize page performance by reducing the number of scripts and stylesheets.")
    }

    if (readability.readabilityScore < 60) {
      recommendations.push("Improve content readability by using shorter sentences and simpler language.")
    }

    if (!robotsTxtAnalysis.hasRobotsTxt) {
      recommendations.push("Create a robots.txt file to control search engine crawling.")
    }

    if (!sitemapAnalysis.hasSitemap) {
      recommendations.push("Create a sitemap.xml file to help search engines discover your content.")
    }

    // Prepare response
    const result = {
      url,
      overallScore,
      metaTags,
      headings,
      contentAnalysis,
      urlAnalysis,
      images,
      socialTags: {
        openGraph,
        twitter,
      },
      schemaMarkup: schemas,
      links: {
        internal: internalLinks,
        external: externalLinks,
        broken: brokenLinks,
      },
      mobileFriendliness,
      security: {
        https: httpsAnalysis,
      },
      performance,
      keywords: keywordAnalysis,
      canonical: canonicalAnalysis,
      hreflang: hreflangAnalysis,
      robotsTxt: robotsTxtAnalysis,
      sitemap: sitemapAnalysis,
      readability,
      issues: {
        critical: criticalIssues,
        major: majorIssues,
        minor: minorIssues,
      },
      recommendations,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in SEO audit:", error)
    return NextResponse.json({ error: "Failed to perform SEO audit", details: error.message }, { status: 500 })
  }
}

