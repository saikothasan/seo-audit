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
    author: $('meta[name="author"]').attr("content") || "",
    language: $("html").attr("lang") || "",
    indexability: {
      noindex:
        $('meta[name="robots"]').attr("content")?.includes("noindex") ||
        $('meta[name="googlebot"]').attr("content")?.includes("noindex") ||
        false,
      nofollow:
        $('meta[name="robots"]').attr("content")?.includes("nofollow") ||
        $('meta[name="googlebot"]').attr("content")?.includes("nofollow") ||
        false,
      noarchive:
        $('meta[name="robots"]').attr("content")?.includes("noarchive") ||
        $('meta[name="googlebot"]').attr("content")?.includes("noarchive") ||
        false,
      nosnippet:
        $('meta[name="robots"]').attr("content")?.includes("nosnippet") ||
        $('meta[name="googlebot"]').attr("content")?.includes("nosnippet") ||
        false,
    },
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
    h2Text: $("h2")
      .map((i, el) => $(el).text().trim())
      .get()
      .slice(0, 5), // Get first 5 h2 headings
    nestedStructure: checkHeadingHierarchy($),
  }

  const issues = []
  if (headings.h1 === 0) {
    issues.push("No H1 heading found")
  } else if (headings.h1 > 1) {
    issues.push("Multiple H1 headings found")
  }

  if (!headings.nestedStructure) {
    issues.push("Heading structure is not properly nested")
  }

  return { headings, issues }
}

// Check if headings follow a proper hierarchy
function checkHeadingHierarchy($: ReturnType<typeof load>) {
  let isProperHierarchy = true
  let lastHeadingLevel = 0

  $("h1, h2, h3, h4, h5, h6").each((i, el) => {
    // Check if the element has a tagName property and it's a string
    if ("tagName" in el && typeof el.tagName === "string") {
      const tagName = el.tagName.toLowerCase()
      const level = Number.parseInt(tagName.substring(1))

      // Check if heading skips a level (e.g., h1 to h3 without h2)
      if (level > lastHeadingLevel + 1 && i > 0) {
        isProperHierarchy = false
        return false // Break the loop
      }

      lastHeadingLevel = level
    }
  })

  return isProperHierarchy
}

// Analyze content
function analyzeContent(html: string) {
  const $ = load(html)
  const bodyText = $("body").text().trim()
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length
  const paragraphs = $("p").length
  const lists = $("ul, ol").length
  const listItems = $("li").length
  const images = $("img").length
  const tables = $("table").length
  const blockquotes = $("blockquote").length
  const codeBlocks = $("pre, code").length

  // Estimate reading time (average reading speed: 200-250 words per minute)
  const readingTimeMinutes = Math.ceil(wordCount / 225)

  // Check for thin content
  const isThinContent = wordCount < 300

  // Check content structure (paragraphs should be separated)
  const hasGoodStructure = paragraphs > 2 && paragraphs < wordCount / 50

  // Check for visual elements
  const hasVisualElements = images > 0 || tables > 0

  const contentAnalysis = {
    wordCount,
    paragraphs,
    lists,
    listItems,
    images,
    tables,
    blockquotes,
    codeBlocks,
    readingTimeMinutes,
    contentToCodeRatio: bodyText.length / html.length,
    isThinContent,
    hasGoodStructure,
    hasVisualElements,
    textToHtmlRatio: bodyText.length / html.length,
    sentences: bodyText.split(/[.!?]+\s/).filter(Boolean).length,
  }

  const issues = []
  if (wordCount < 300) {
    issues.push("Content is too short (less than 300 words)")
  }

  if (paragraphs < 3 && wordCount > 300) {
    issues.push("Content has too few paragraphs for its length")
  }

  if (contentAnalysis.contentToCodeRatio < 0.1) {
    issues.push("Text to HTML ratio is low (less than 10%)")
  }

  if (!hasVisualElements && wordCount > 500) {
    issues.push("Long content lacks visual elements (images or tables)")
  }

  return { contentAnalysis, issues }
}

// Analyze URL structure
function analyzeUrl(url: string) {
  const parsedUrl = parseUrl(url)
  const pathSegments = parsedUrl.pathname?.split("/").filter(Boolean) || []

  // Check for URL parameters
  const queryParams = new URLSearchParams(parsedUrl.query || "")
  const queryParamNames = Array.from(queryParams.keys())

  // Check for dynamic parameters that might cause duplicate content
  const potentialDynamicParams = queryParamNames.filter((param) =>
    ["sort", "view", "display", "layout", "page", "filter"].includes(param),
  )

  // Analyze URL keywords and format
  const urlWords = pathSegments.join(" ").replace(/-/g, " ").toLowerCase()
  const containsStopWords = /\b(and|or|but|the|a|an|in|on|at|of|for|to|by)\b/.test(urlWords)
  const hasKeywords = pathSegments.length > 0
  const isCleanFormat = !/[^\w\-/]/.test(parsedUrl.pathname || "") && !parsedUrl.pathname?.includes("__")
  const isSecure = parsedUrl.protocol === "https:"

  const urlAnalysis = {
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname || "",
    path: parsedUrl.pathname || "",
    pathSegments,
    pathLength: parsedUrl.pathname?.length || 0,
    totalUrlLength: url.length,
    hasQueryParams: queryParamNames.length > 0,
    queryParams: queryParamNames,
    potentialDynamicParams,
    containsStopWords,
    hasKeywords,
    isCleanFormat,
    isSecure,
    domainLength: parsedUrl.hostname?.length || 0,
    subdomains: (parsedUrl.hostname?.match(/\./g) || []).length > 1,
  }

  const issues = []
  if (urlAnalysis.pathLength > 100) {
    issues.push("URL path is too long (over 100 characters)")
  }

  if (urlAnalysis.totalUrlLength > 150) {
    issues.push("Total URL length is too long (over 150 characters)")
  }

  if (urlAnalysis.hasQueryParams) {
    issues.push("URL contains query parameters which may affect SEO")
  }

  if (potentialDynamicParams.length > 0) {
    issues.push(`URL contains parameters that might cause duplicate content: ${potentialDynamicParams.join(", ")}`)
  }

  if (containsStopWords) {
    issues.push("URL contains stop words which are unnecessary")
  }

  if (!isCleanFormat) {
    issues.push("URL contains special characters or double underscores")
  }

  if (!isSecure) {
    issues.push("URL uses HTTP instead of HTTPS")
  }

  return { urlAnalysis, issues }
}

// Analyze images
function analyzeImages(html: string, baseUrl: string) {
  const $ = load(html)
  const images = $("img")
    .map((i, el) => {
      const img = $(el)

      // Get the full URL for image src
      let src = img.attr("src") || ""
      if (src.startsWith("/")) {
        // Handle relative URLs
        const hostname = parseUrl(baseUrl).hostname || ""
        const protocol = parseUrl(baseUrl).protocol || "https:"
        src = `${protocol}//${hostname}${src}`
      } else if (src && !src.startsWith("http") && !src.startsWith("data:")) {
        src = new URL(src, baseUrl).href
      }

      // Check for lazy loading
      const isLazyLoaded =
        img.attr("loading") === "lazy" ||
        img.attr("data-src") ||
        img.attr("data-lazy-src") ||
        img.hasClass("lazy") ||
        img.hasClass("lazyload")

      // Check for image size hints
      const sizesAttr = img.attr("sizes") || ""
      const srcsetAttr = img.attr("srcset") || ""
      const hasResponsiveConfig = sizesAttr !== "" || srcsetAttr !== ""

      return {
        src,
        alt: img.attr("alt") || "",
        width: img.attr("width") || "",
        height: img.attr("height") || "",
        title: img.attr("title") || "",
        hasAlt: !!img.attr("alt"),
        hasWidthHeight: !!(img.attr("width") && img.attr("height")),
        isLazyLoaded,
        hasResponsiveConfig,
        isInlineBase64: (src || "").startsWith("data:"),
        fileExtension: src ? src.split(".").pop()?.toLowerCase() : "",
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

  const nonWebpImages = images.filter(
    (img) => !img.isInlineBase64 && img.fileExtension && ["jpg", "jpeg", "png", "gif"].includes(img.fileExtension),
  )
  if (nonWebpImages.length > 3) {
    issues.push(`${nonWebpImages.length} images are not using WebP format`)
  }

  const nonLazyLoadedImages = images.filter((img) => !img.isLazyLoaded && !img.isInlineBase64)
  if (nonLazyLoadedImages.length > 3) {
    issues.push(`${nonLazyLoadedImages.length} images are not lazy loaded`)
  }

  const nonResponsiveImages = images.filter((img) => !img.hasResponsiveConfig && !img.isInlineBase64)
  if (nonResponsiveImages.length > 3) {
    issues.push(`${nonResponsiveImages.length} images don't have responsive image configuration (srcset/sizes)`)
  }

  return {
    images,
    issues,
    imageStats: {
      total: images.length,
      withAlt: images.filter((img) => img.hasAlt).length,
      withDimensions: images.filter((img) => img.hasWidthHeight).length,
      lazyLoaded: images.filter((img) => img.isLazyLoaded).length,
      responsive: images.filter((img) => img.hasResponsiveConfig).length,
      base64: images.filter((img) => img.isInlineBase64).length,
    },
  }
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
    siteName: $('meta[property="og:site_name"]').attr("content") || "",
    locale: $('meta[property="og:locale"]').attr("content") || "",
  }

  const twitter = {
    card: $('meta[name="twitter:card"]').attr("content") || "",
    title: $('meta[name="twitter:title"]').attr("content") || "",
    description: $('meta[name="twitter:description"]').attr("content") || "",
    image: $('meta[name="twitter:image"]').attr("content") || "",
    site: $('meta[name="twitter:site"]').attr("content") || "",
    creator: $('meta[name="twitter:creator"]').attr("content") || "",
  }

  const facebook = {
    appId: $('meta[property="fb:app_id"]').attr("content") || "",
    pageId: $('meta[property="fb:page_id"]').attr("content") || "",
  }

  const issues = []
  if (!openGraph.title && !openGraph.description) {
    issues.push("Missing Open Graph tags")
  } else {
    if (!openGraph.title) issues.push("Missing Open Graph title")
    if (!openGraph.description) issues.push("Missing Open Graph description")
    if (!openGraph.image) issues.push("Missing Open Graph image")
  }

  if (!twitter.card && !twitter.title) {
    issues.push("Missing Twitter Card tags")
  } else {
    if (!twitter.card) issues.push("Missing Twitter card type")
    if (!twitter.title && !openGraph.title) issues.push("Missing Twitter title")
    if (!twitter.image && !openGraph.image) issues.push("Missing Twitter image")
  }

  return {
    openGraph,
    twitter,
    facebook,
    issues,
    hasOpenGraph: !!(openGraph.title || openGraph.description),
    hasTwitterCard: !!(twitter.card || twitter.title),
    hasFacebookData: !!(facebook.appId || facebook.pageId),
  }
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
  const schemaTypes: string[] = []

  // Look for JSON-LD schema
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const schema = JSON.parse($(el).html() || "{}")
      const schemaType = schema["@type"] || "Unknown"
      schemas.push({
        type: "json-ld",
        content: schemaType,
      })
      schemaTypes.push(schemaType)
    } catch (e) {
      console.error("Error parsing JSON-LD schema", e)
    }
  })

  // Look for microdata schema
  $("[itemtype]").each((i, el) => {
    const itemType = $(el).attr("itemtype") || "Unknown"
    schemas.push({
      type: "microdata",
      content: itemType,
    })

    // Extract the schema type from the URL
    const typeMatch = itemType.match(/\/([^/]+)$/)
    if (typeMatch && typeMatch[1]) {
      schemaTypes.push(typeMatch[1])
    }
  })

  // Look for RDFa schema
  $("[typeof]").each((i, el) => {
    const schemaType = $(el).attr("typeof") || "Unknown"
    schemas.push({
      type: "rdfa",
      content: schemaType,
    })
    schemaTypes.push(schemaType)
  })

  const issues: string[] = []
  if (schemas.length === 0) {
    issues.push("No schema markup detected")
  } else {
    const hasWebpageSchema = schemaTypes.some(
      (t) => t.includes("WebPage") || t.includes("Article") || t.includes("NewsArticle"),
    )
    const hasOrganizationSchema = schemaTypes.some((t) => t.includes("Organization") || t.includes("LocalBusiness"))
    const hasBreadcrumbSchema = schemaTypes.some((t) => t.includes("BreadcrumbList"))

    if (!hasWebpageSchema) {
      issues.push("No WebPage, Article, or NewsArticle schema detected")
    }

    if (!hasOrganizationSchema) {
      issues.push("No Organization or LocalBusiness schema detected")
    }

    if (!hasBreadcrumbSchema) {
      issues.push("No BreadcrumbList schema detected")
    }
  }

  return {
    schemas,
    schemaTypes,
    issues,
    hasSchema: schemas.length > 0,
    hasJsonLd: schemas.some((s) => s.type === "json-ld"),
    hasMicrodata: schemas.some((s) => s.type === "microdata"),
    hasRdfa: schemas.some((s) => s.type === "rdfa"),
  }
}

// Analyze internal links
function analyzeInternalLinks(html: string, baseUrl: string) {
  const $ = load(html)
  const hostname = parseUrl(baseUrl).hostname || ""
  const currentPath = parseUrl(baseUrl).pathname || "/"

  const internalLinks = $("a[href]")
    .map((i, el) => {
      const href = $(el).attr("href") || ""
      let fullUrl = href

      // Handle relative URLs
      if (href.startsWith("/")) {
        const protocol = parseUrl(baseUrl).protocol || "https:"
        fullUrl = `${protocol}//${hostname}${href}`
      } else if (!href.startsWith("http")) {
        fullUrl = new URL(href, baseUrl).href
      }

      const isInternal = hostname ? fullUrl.includes(hostname) : false
      if (!isInternal) return null

      // Extract path from the URL for path analysis
      let path = ""
      try {
        path = new URL(fullUrl).pathname
      } catch (e) {
        // If URL parsing fails, just use the href
        path = href
      }

      const isCurrentPage = path === currentPath
      const hasText = !!$(el).text().trim()
      const linkText = $(el).text().trim()
      const isGeneric = /click here|read more|learn more|get started|find out/i.test(linkText)

      return {
        text: linkText || "[No Text]",
        url: fullUrl,
        path,
        isNofollow: $(el).attr("rel")?.includes("nofollow") || false,
        isCurrentPage,
        hasText,
        isGeneric,
        hasTitle: !!$(el).attr("title"),
        inNavigation: $(el).parents("nav").length > 0,
        inFooter: $(el).parents("footer").length > 0,
        inMainContent: $(el).parents("main, article, .content").length > 0,
      }
    })
    .get()
    .filter(Boolean)

  // Group links by path to identify duplicates
  const linksByPath: Record<string, number> = {}
  internalLinks.forEach((link) => {
    linksByPath[link.path] = (linksByPath[link.path] || 0) + 1
  })

  // Find duplicate links
  const duplicateLinks = Object.entries(linksByPath)
    .filter(([_, count]) => count > 1)
    .map(([path]) => path)

  // Count links in main navigation
  const navigationLinks = internalLinks.filter((link) => link.inNavigation)

  // Analyze link distribution
  const linkDistribution = {
    navigation: internalLinks.filter((link) => link.inNavigation).length,
    footer: internalLinks.filter((link) => link.inFooter).length,
    content: internalLinks.filter((link) => link.inMainContent).length,
    other: internalLinks.filter((link) => !link.inNavigation && !link.inFooter && !link.inMainContent).length,
  }

  const issues = []
  if (internalLinks.length === 0) {
    issues.push("No internal links found")
  }

  const genericTextLinks = internalLinks.filter((link) => link.isGeneric)
  if (genericTextLinks.length > 0) {
    issues.push(`${genericTextLinks.length} internal links use generic anchor text`)
  }

  const noTextLinks = internalLinks.filter((link) => !link.hasText)
  if (noTextLinks.length > 0) {
    issues.push(`${noTextLinks.length} internal links have no anchor text`)
  }

  const nofollowInternalLinks = internalLinks.filter((link) => link.isNofollow)
  if (nofollowInternalLinks.length > 3) {
    issues.push(`${nofollowInternalLinks.length} internal links have nofollow attribute`)
  }

  if (duplicateLinks.length > 3) {
    issues.push(`${duplicateLinks.length} duplicate internal links to the same URL`)
  }

  if (internalLinks.length > 0 && linkDistribution.content < internalLinks.length * 0.3) {
    issues.push("Low percentage of internal links in main content area")
  }

  return {
    internalLinks,
    duplicateLinks,
    linkDistribution,
    issues,
    stats: {
      total: internalLinks.length,
      unique: Object.keys(linksByPath).length,
      nofollow: internalLinks.filter((link) => link.isNofollow).length,
      withTitle: internalLinks.filter((link) => link.hasTitle).length,
      toCurrentPage: internalLinks.filter((link) => link.isCurrentPage).length,
    },
  }
}

// Analyze external links
function analyzeExternalLinks(html: string, baseUrl: string) {
  const $ = load(html)
  const hostname = parseUrl(baseUrl).hostname || ""

  const externalLinks = $("a[href]")
    .map((i, el) => {
      const href = $(el).attr("href") || ""
      if (!href.startsWith("http")) return null

      const linkHostname = parseUrl(href).hostname || ""
      if (!linkHostname || (hostname && linkHostname === hostname)) return null

      const linkText = $(el).text().trim()
      const hasSafeRel =
        ($(el).attr("rel") || "").includes("noopener") && ($(el).attr("rel") || "").includes("noreferrer")

      const isSponsored = ($(el).attr("rel") || "").includes("sponsored")
      const isUGC = ($(el).attr("rel") || "").includes("ugc")

      return {
        text: linkText || "[No Text]",
        url: href,
        hostname: linkHostname,
        isNofollow: ($(el).attr("rel") || "").includes("nofollow"),
        isSponsored,
        isUGC,
        hasSafeRel,
        hasExternalIndicator: $(el).attr("target") === "_blank",
        hasIcon: $(el).find("svg, img, i").length > 0,
      }
    })
    .get()
    .filter(Boolean)

  // Group by domain
  const domainCount: Record<string, number> = {}
  externalLinks.forEach((link) => {
    domainCount[link.hostname] = (domainCount[link.hostname] || 0) + 1
  })

  // Sort domains by frequency
  const topDomains = Object.entries(domainCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({ domain, count }))

  const issues = []
  const externalLinksWithoutNofollow = externalLinks.filter((link) => !link.isNofollow)
  if (externalLinksWithoutNofollow.length > 0) {
    issues.push(`${externalLinksWithoutNofollow.length} external links without nofollow`)
  }

  const externalLinksWithoutSafeRel = externalLinks.filter((link) => link.hasExternalIndicator && !link.hasSafeRel)
  if (externalLinksWithoutSafeRel.length > 0) {
    issues.push(`${externalLinksWithoutSafeRel.length} external links missing noopener/noreferrer with target="_blank"`)
  }

  // Check for potentially toxic domains
  const potentiallyToxicDomains = externalLinks.filter(
    (link) =>
      !link.isNofollow &&
      (link.hostname.includes("adult") ||
        link.hostname.includes("casino") ||
        link.hostname.includes("poker") ||
        link.hostname.includes("bet") ||
        link.hostname.includes("loan") ||
        link.hostname.includes("pills")),
  )

  if (potentiallyToxicDomains.length > 0) {
    issues.push(`${potentiallyToxicDomains.length} links to potentially toxic domains without nofollow`)
  }

  return {
    externalLinks,
    topDomains,
    issues,
    stats: {
      total: externalLinks.length,
      nofollow: externalLinks.filter((link) => link.isNofollow).length,
      sponsored: externalLinks.filter((link) => link.isSponsored).length,
      ugc: externalLinks.filter((link) => link.isUGC).length,
      withTargetBlank: externalLinks.filter((link) => link.hasExternalIndicator).length,
      uniqueDomains: Object.keys(domainCount).length,
    },
  }
}

// Check for mobile-friendliness
function analyzeMobileFriendliness(html: string) {
  const $ = load(html)

  const viewportTag = $('meta[name="viewport"]').attr("content") || ""
  const hasMobileViewport = viewportTag.includes("width=device-width")

  // Check for fixed-width elements
  const fixedWidthElements = $("*").filter((i, el) => {
    const style = $(el).attr("style") || ""
    const width = $(el).css("width")
    return (
      (width && width.includes("px") && Number.parseInt(width) > 600) ||
      (style.includes("width:") && style.includes("px") && Number.parseInt(style.split("width:")[1]) > 600)
    )
  }).length

  // Check for small font sizes
  const smallFontElements = $("*").filter((i, el) => {
    const style = $(el).attr("style") || ""
    const fontSize = $(el).css("font-size")
    return (
      (fontSize && fontSize.includes("px") && Number.parseInt(fontSize) < 10) ||
      (style.includes("font-size:") && style.includes("px") && Number.parseInt(style.split("font-size:")[1]) < 10)
    )
  }).length

  // Check for small tap targets
  const touchElements = $("a, button, input, select, textarea").length
  const smallTouchElements = $("a, button").filter((i, el) => {
    const width = $(el).css("width")
    const height = $(el).css("height")

    // Parse dimensions, ensuring we get numbers or null
    let widthValue = null
    let heightValue = null

    if (width && typeof width === "string") {
      const parsed = Number.parseInt(width, 10)
      if (!isNaN(parsed)) {
        widthValue = parsed
      }
    }

    if (height && typeof height === "string") {
      const parsed = Number.parseInt(height, 10)
      if (!isNaN(parsed)) {
        heightValue = parsed
      }
    }

    // Check if dimensions are specified and less than recommended touch target size (44px)
    // Return true only if we have at least one valid dimension that's too small
    return (widthValue !== null && widthValue < 44) || (heightValue !== null && heightValue < 44)
  }).length

  // Check for media queries
  const hasMediaQueries = html.includes("@media") || $("link[media]").length > 0

  // Check for mobile-specific meta tags
  const hasAppleMobileTag = $('meta[name="apple-mobile-web-app-capable"]').length > 0
  const hasThemeColorTag = $('meta[name="theme-color"]').length > 0

  // Check for amp link
  const hasAmpLink = $('link[rel="amphtml"]').length > 0

  const issues = []
  if (!hasMobileViewport) {
    issues.push("No mobile viewport meta tag")
  }

  if (viewportTag.includes("user-scalable=no") || viewportTag.includes("maximum-scale=1")) {
    issues.push("Viewport tag prevents zooming, which hurts accessibility")
  }

  if (fixedWidthElements > 5) {
    issues.push(`${fixedWidthElements} elements have fixed width that may overflow on mobile screens`)
  }

  if (smallFontElements > 5) {
    issues.push(`${smallFontElements} elements have font sizes that may be too small on mobile devices`)
  }

  if (smallTouchElements > 0) {
    issues.push(`${smallTouchElements} touch elements may be too small for mobile users`)
  }

  if (!hasMediaQueries) {
    issues.push("No media queries detected for responsive design")
  }

  return {
    hasMobileViewport,
    viewportTag,
    touchElements,
    smallTouchElements,
    fixedWidthElements,
    hasMediaQueries,
    hasAmpLink,
    hasAppleMobileTag,
    hasThemeColorTag,
    issues,
  }
}

// Check for HTTPS security
function analyzeHttps(url: string) {
  const isHttps = url.startsWith("https://")

  // Check for mixed content
  const hasMixedContent = false // This would require client-side check

  const issues = []
  if (!isHttps) {
    issues.push("Website is not using HTTPS")
  }

  if (hasMixedContent) {
    issues.push("Page has mixed content (HTTP resources on HTTPS page)")
  }

  return {
    isHttps,
    hasMixedContent,
    issues,
  }
}

// Analyze page performance (basic metrics)
function analyzePerformance(html: string) {
  const $ = load(html)

  // Count resources
  const scripts = $("script").length
  const externalScripts = $("script[src]").length
  const inlineScripts = scripts - externalScripts

  const styles = $('link[rel="stylesheet"]').length
  const inlineStyles = $("style").length
  const images = $("img").length
  const iframes = $("iframe").length
  const fonts = $('link[rel="preload"][as="font"], link[href*=".woff"], link[href*=".ttf"]').length

  // Check for render-blocking resources
  const renderBlockingStyles = $('link[rel="stylesheet"]:not([media="print"])').length
  const renderBlockingScripts = $('script:not([defer]):not([async]):not([type="module"])').length

  // Check for resource hints
  const hasPreconnect = $('link[rel="preconnect"]').length > 0
  const hasDNSPrefetch = $('link[rel="dns-prefetch"]').length > 0
  const hasPreload = $('link[rel="preload"]').length > 0

  // Check for lazy loading
  const lazyLoadedImgs = $('img[loading="lazy"], img[data-src]').length
  const lazyLoadingRatio = images > 0 ? lazyLoadedImgs / images : 0

  // Check for critical CSS
  const criticalCSSLength = $("style:first").text().length
  const hasCriticalCSS = criticalCSSLength > 0 && criticalCSSLength < 10000

  // Estimate page weight
  const htmlSize = html.length

  // Detect problematic performance patterns
  const hasJQuery = html.includes("jquery") || html.includes("jQuery")
  const hasGoogleFonts = html.includes("fonts.googleapis.com")
  const hasLargeFrameworks = html.includes("angular") || html.includes("react") || html.includes("vue")

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

  if (renderBlockingStyles > 2) {
    issues.push(`${renderBlockingStyles} render-blocking stylesheets`)
  }

  if (renderBlockingScripts > 2) {
    issues.push(`${renderBlockingScripts} render-blocking scripts`)
  }

  if (images > 5 && lazyLoadingRatio < 0.5) {
    issues.push("Less than 50% of images use lazy loading")
  }

  if (!hasPreconnect && !hasDNSPrefetch && externalScripts > 3) {
    issues.push("No preconnect or dns-prefetch resource hints used")
  }

  if (hasJQuery) {
    issues.push("jQuery detected, which may impact performance")
  }

  if (hasGoogleFonts && !hasPreconnect) {
    issues.push("Google Fonts used without preconnect")
  }

  return {
    resourceCounts: {
      scripts,
      externalScripts,
      inlineScripts,
      styles,
      inlineStyles,
      images,
      iframes,
      fonts,
    },
    htmlSize,
    renderBlocking: {
      styles: renderBlockingStyles,
      scripts: renderBlockingScripts,
    },
    resourceHints: {
      preconnect: hasPreconnect,
      dnsPrefetch: hasDNSPrefetch,
      preload: hasPreload,
    },
    lazyLoading: {
      images: lazyLoadedImgs,
      ratio: lazyLoadingRatio,
    },
    hasCriticalCSS,
    hasJQuery,
    hasGoogleFonts,
    hasLargeFrameworks,
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
      inFirstParagraph: $("p").first().text().toLowerCase().includes(keyword),
      inHeadings: $("h2, h3, h4, h5, h6").text().toLowerCase().includes(keyword),
      prominence: calculateKeywordProminence(keyword, bodyText.toLowerCase()),
    }
  })

  // Calculate TF-IDF score (simplified)
  const wordCount = bodyText.split(/\s+/).length

  // Sort keywords by importance
  const sortedKeywords = [...keywordAnalysis]
    .sort((a, b) => {
      // Create a score based on multiple factors
      const scoreA =
        (a.inTitle ? 3 : 0) + (a.inH1 ? 2 : 0) + (a.inUrl ? 2 : 0) + (a.occurrences / (wordCount || 1)) * 100
      const scoreB =
        (b.inTitle ? 3 : 0) + (b.inH1 ? 2 : 0) + (b.inUrl ? 2 : 0) + (b.occurrences / (wordCount || 1)) * 100
      return scoreB - scoreA
    })
    .slice(0, 10) // Get top 10 keywords

  const issues = []
  keywordAnalysis.forEach((analysis) => {
    if (analysis.density > 0.05) {
      issues.push(`Keyword "${analysis.keyword}" may be overused (${(analysis.density * 100).toFixed(1)}%)`)
    }
    if (analysis.occurrences > 0 && !analysis.inTitle && !analysis.inH1) {
      issues.push(`Keyword "${analysis.keyword}" not found in title or H1`)
    }
    if (analysis.occurrences > 5 && !analysis.inMetaDescription) {
      issues.push(`Keyword "${analysis.keyword}" not found in meta description`)
    }
  })

  // Check keyword consistency
  const hasConsistentKeywords =
    sortedKeywords.length > 0 &&
    sortedKeywords[0].inTitle &&
    sortedKeywords[0].inH1 &&
    sortedKeywords[0].inMetaDescription

  if (!hasConsistentKeywords && sortedKeywords.length > 0) {
    issues.push("Primary keyword not consistently used across title, H1, and meta description")
  }

  return {
    keywordAnalysis,
    sortedKeywords,
    issues,
    stats: {
      totalKeywords: extractedKeywords.size,
      keywordsInTitle: keywordAnalysis.filter((k) => k.inTitle).length,
      keywordsInH1: keywordAnalysis.filter((k) => k.inH1).length,
      keywordsInMetaDescription: keywordAnalysis.filter((k) => k.inMetaDescription).length,
      keywordsInUrl: keywordAnalysis.filter((k) => k.inUrl).length,
    },
  }
}

// Helper function to calculate keyword prominence (position in text)
function calculateKeywordProminence(keyword: string, text: string): number {
  const firstPosition = text.indexOf(keyword)
  if (firstPosition === -1) return 0

  // Calculate prominence as percentage of position from start
  // Lower percentage means more prominent (closer to beginning)
  return Math.max(0, Math.min(100, (firstPosition / text.length) * 100))
}

// Check for canonical issues
function analyzeCanonical(html: string, url: string) {
  const $ = load(html)

  const canonicalUrl = $('link[rel="canonical"]').attr("href") || ""
  const hasCanonical = !!canonicalUrl
  const isCanonicalSelf = canonicalUrl === url

  // Check for relative canonical URLs
  const isRelativeCanonical = canonicalUrl.startsWith("/")

  // Check for multiple canonical tags
  const multipleCanonicals = $('link[rel="canonical"]').length > 1

  // Check for pagination links
  const hasPrevLink = $('link[rel="prev"]').length > 0
  const hasNextLink = $('link[rel="next"]').length > 0
  const prevLink = $('link[rel="prev"]').attr("href") || ""
  const nextLink = $('link[rel="next"]').attr("href") || ""

  // Check for hreflang links
  const hreflangLinks = $('link[rel="alternate"][hreflang]').length

  const issues = []
  if (!hasCanonical) {
    issues.push("No canonical URL specified")
  } else if (!isCanonicalSelf) {
    issues.push("Canonical URL points to a different page")
  }

  if (isRelativeCanonical) {
    issues.push("Canonical URL is relative, should be absolute")
  }

  if (multipleCanonicals) {
    issues.push("Multiple canonical tags found")
  }

  if ((hasPrevLink || hasNextLink) && !hasCanonical) {
    issues.push("Pagination links present but no canonical tag")
  }

  return {
    hasCanonical,
    canonicalUrl,
    isCanonicalSelf,
    isRelativeCanonical,
    multipleCanonicals,
    pagination: {
      hasPrevLink,
      hasNextLink,
      prevLink,
      nextLink,
    },
    hreflangLinks,
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

  // Check for x-default hreflang
  const hasXDefault = hreflangTags.some((tag) => tag.hreflang === "x-default")

  // Check for self-referencing hreflang
  const pageLang = $("html").attr("lang") || ""
  const hasSelfReference = hreflangTags.some((tag) => tag.hreflang === pageLang)

  // Check for language consistency
  const pageLanguage = $("html").attr("lang") || ""
  const isLanguageConsistent = pageLanguage && hreflangTags.some((tag) => tag.hreflang.startsWith(pageLanguage))

  const issues = []
  if (hreflangTags.length > 0) {
    if (!hasXDefault) {
      issues.push("Missing x-default hreflang tag")
    }

    if (!hasSelfReference && pageLang) {
      issues.push("Missing self-referencing hreflang tag")
    }

    if (!isLanguageConsistent && pageLanguage) {
      issues.push("HTML lang attribute doesn't match any hreflang tags")
    }

    // Check for relative URLs in hreflang
    const relativeHreflangs = hreflangTags.filter((tag) => tag.href.startsWith("/"))
    if (relativeHreflangs.length > 0) {
      issues.push("Hreflang tags should use absolute URLs")
    }
  }

  return {
    hasHreflang,
    hreflangTags,
    hasXDefault,
    hasSelfReference,
    isLanguageConsistent,
    issues,
  }
}

// Check for robots.txt
async function analyzeRobotsTxt(baseUrl: string) {
  try {
    // Extract protocol and hostname
    const { protocol, hostname } = parseUrl(baseUrl)
    if (!hostname) {
      return {
        hasRobotsTxt: false,
        robotsTxtContent: "",
        issues: ["Could not parse hostname from URL"],
      }
    }

    const robotsUrl = `${protocol || "https:"}//${hostname}/robots.txt`
    const response = await axios.get(robotsUrl, { timeout: 5000 })

    const hasRobotsTxt = response.status === 200
    const robotsTxtContent = hasRobotsTxt ? response.data : ""

    // Parse robots.txt content
    const userAgentSections: Record<string, string[]> = {}
    let currentUserAgent = "*"

    if (hasRobotsTxt && robotsTxtContent) {
      const lines = robotsTxtContent.split("\n")

      lines.forEach((line) => {
        line = line.trim()

        // Skip comments and empty lines
        if (line.startsWith("#") || line === "") return

        // Check for user-agent
        const userAgentMatch = line.match(/^User-agent:\s*(.+)$/i)
        if (userAgentMatch) {
          currentUserAgent = userAgentMatch[1]
          if (!userAgentSections[currentUserAgent]) {
            userAgentSections[currentUserAgent] = []
          }
          return
        }

        // Add directives to current user agent
        if (currentUserAgent && userAgentSections[currentUserAgent]) {
          userAgentSections[currentUserAgent].push(line)
        }
      })
    }

    // Check for sitemap in robots.txt
    const hasSitemapInRobots = robotsTxtContent.toLowerCase().includes("sitemap:")

    const issues = []
    if (!hasRobotsTxt) {
      issues.push("No robots.txt file found")
    } else {
      if (robotsTxtContent.includes("Disallow: /")) {
        issues.push("robots.txt contains disallow rules")
      }

      if (!hasSitemapInRobots) {
        issues.push("No sitemap directive in robots.txt")
      }

      if (Object.keys(userAgentSections).length === 0) {
        issues.push("robots.txt has no valid user-agent sections")
      }
    }

    return {
      hasRobotsTxt,
      robotsTxtContent,
      userAgentSections,
      hasSitemapInRobots,
      issues,
    }
  } catch (error) {
    return {
      hasRobotsTxt: false,
      robotsTxtContent: "",
      userAgentSections: {},
      hasSitemapInRobots: false,
      issues: ["Failed to fetch robots.txt"],
    }
  }
}

// Check for sitemap.xml
async function analyzeSitemap(baseUrl: string) {
  try {
    // Extract protocol and hostname
    const { protocol, hostname } = parseUrl(baseUrl)
    if (!hostname) {
      return {
        hasSitemap: false,
        sitemapUrl: "",
        isValidXml: false,
        issues: ["Could not parse hostname from URL"],
      }
    }

    const sitemapUrl = `${protocol || "https:"}//${hostname}/sitemap.xml`
    const response = await axios.get(sitemapUrl, { timeout: 5000 })

    const hasSitemap = response.status === 200
    const sitemapContent = hasSitemap ? response.data : ""

    // Simple check if it looks like XML
    const isValidXml = hasSitemap && sitemapContent.includes("<?xml")

    // Count URLs in sitemap
    const urlCount = (sitemapContent.match(/<url>/g) || []).length

    // Check for sitemap index
    const isSitemapIndex = sitemapContent.includes("<sitemapindex")
    const sitemapCount = (sitemapContent.match(/<sitemap>/g) || []).length

    // Check for lastmod tags
    const hasLastmod = sitemapContent.includes("<lastmod>")

    const issues = []
    if (!hasSitemap) {
      issues.push("No sitemap.xml file found")
    } else {
      if (!isValidXml) {
        issues.push("sitemap.xml does not appear to be valid XML")
      }

      if (urlCount === 0 && !isSitemapIndex) {
        issues.push("Sitemap contains no URL entries")
      }

      if (!hasLastmod && !isSitemapIndex) {
        issues.push("Sitemap URLs don't have lastmod dates")
      }
    }

    return {
      hasSitemap,
      sitemapUrl,
      isValidXml,
      urlCount,
      isSitemapIndex,
      sitemapCount,
      hasLastmod,
      issues,
    }
  } catch (error) {
    return {
      hasSitemap: false,
      sitemapUrl: `${baseUrl.replace(/\/$/, "")}/sitemap.xml`,
      isValidXml: false,
      urlCount: 0,
      isSitemapIndex: false,
      sitemapCount: 0,
      hasLastmod: false,
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

  // Check for complex words
  const complexWordCount = text.split(/\s+/).filter((word) => {
    const word_clean = word.replace(/[,.;:?!()[\]{}'"]/g, "").toLowerCase()
    return word_clean.length > 3 && countSyllables(word_clean) >= 3
  }).length

  const complexWordPercentage = words > 0 ? (complexWordCount / words) * 100 : 0

  // Calculate average sentence length
  const averageSentenceLength = sentences > 0 ? words / sentences : 0

  // Detect passive voice (very basic approximation)
  const passiveVoiceMatches = text.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi) || []
  const passiveVoiceCount = passiveVoiceMatches.length

  const issues = []
  if (readabilityScore < 60) {
    issues.push(`Content may be difficult to read (score: ${readabilityScore.toFixed(1)})`)
  }

  if (averageSentenceLength > 25) {
    issues.push(`Average sentence length is too long (${averageSentenceLength.toFixed(1)} words)`)
  }

  if (complexWordPercentage > 15) {
    issues.push(`Too many complex words (${complexWordPercentage.toFixed(1)}% of content)`)
  }

  if (passiveVoiceCount > 5 && sentences > 0 && passiveVoiceCount / sentences > 0.2) {
    issues.push(`High usage of passive voice detected (${passiveVoiceCount} instances)`)
  }

  return {
    readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
    readabilityLevel,
    textStats: {
      sentences,
      words,
      syllables,
      averageWordsPerSentence: averageSentenceLength,
      averageSyllablesPerWord: words > 0 ? syllables / words : 0,
      complexWords: complexWordCount,
      complexWordPercentage,
      passiveVoice: passiveVoiceCount,
    },
    issues,
  }
}

// Check for broken links
async function checkBrokenLinks(html: string, baseUrl: string) {
  const $ = load(html)
  const { protocol, hostname } = parseUrl(baseUrl)

  if (!hostname) {
    return {
      checkedLinks: 0,
      brokenLinks: [],
      issues: ["Could not parse hostname from URL"],
    }
  }

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
        fullUrl = `${protocol || "https:"}//${hostname}${href}`
      } else if (!href.startsWith("http")) {
        fullUrl = new URL(href, baseUrl).href
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

// Detect page language
function detectLanguage(html: string) {
  const $ = load(html)

  // Check HTML lang attribute
  const htmlLang = $("html").attr("lang") || ""

  // Check for hreflang tags
  const hreflangTags = $('link[rel="alternate"][hreflang]')
    .map((i, el) => $(el).attr("hreflang") || "")
    .get()

  // Check for content-language meta tag
  const metaLang = $('meta[http-equiv="content-language"]').attr("content") || ""

  const detectedLang = htmlLang || metaLang || (hreflangTags.length > 0 ? hreflangTags[0] : "")

  const issues = []
  if (!htmlLang) {
    issues.push("HTML tag is missing lang attribute")
  }

  if (htmlLang && metaLang && htmlLang !== metaLang) {
    issues.push("Inconsistent language declarations: HTML lang and meta content-language differ")
  }

  return {
    htmlLang,
    metaLang,
    hreflangTags,
    detectedLang,
    issues,
  }
}

// Detect AMP version
function detectAmp(html: string) {
  const $ = load(html)

  // Check for AMP link
  const ampLink = $('link[rel="amphtml"]').attr("href") || ""
  const hasAmpLink = ampLink !== ""

  // Check if the page itself is AMP
  const isAmp = html.includes("<html amp") || html.includes("⚡") || html.includes("amp-boilerplate")

  // Check for AMP components
  const ampComponents = $('script[src*="ampproject.org"]').length

  const issues = []
  if (!isAmp && !hasAmpLink) {
    issues.push("No AMP version of this page is available")
  }

  if (isAmp && ampComponents === 0) {
    issues.push("Page declares as AMP but has no AMP components")
  }

  return {
    isAmp,
    hasAmpLink,
    ampLink,
    ampComponents,
    issues,
  }
}

// Check for favicon
function checkFavicon(html: string, baseUrl: string) {
  const $ = load(html)

  // Check for favicon links
  const faviconLinks = $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .map((i, el) => {
      const href = $(el).attr("href") || ""
      const type = $(el).attr("type") || ""
      const sizes = $(el).attr("sizes") || ""
      const rel = $(el).attr("rel") || ""

      // Handle relative URLs
      let fullUrl = href
      if (href.startsWith("/")) {
        const { protocol, hostname } = parseUrl(baseUrl)
        fullUrl = `${protocol || "https:"}//${hostname || ""}${href}`
      } else if (href && !href.startsWith("http") && !href.startsWith("data:")) {
        fullUrl = new URL(href, baseUrl).href
      }

      return {
        href: fullUrl,
        type,
        sizes,
        rel,
      }
    })
    .get()

  // Check for default favicon.ico
  const hasDefaultFavicon = faviconLinks.some(
    (link) => link.href.includes("favicon.ico") || (link.rel.includes("icon") && !link.rel.includes("apple")),
  )

  // Check for apple touch icon
  const hasAppleTouchIcon = faviconLinks.some((link) => link.rel.includes("apple-touch-icon"))

  // Check for different sizes
  const hasDifferentSizes = new Set(faviconLinks.map((link) => link.sizes)).size > 1

  const issues = []
  if (faviconLinks.length === 0) {
    issues.push("No favicon found")
  }

  if (!hasDefaultFavicon) {
    issues.push("No standard favicon.ico found")
  }

  if (!hasAppleTouchIcon) {
    issues.push("No Apple Touch Icon found for iOS devices")
  }

  if (!hasDifferentSizes && faviconLinks.length > 0) {
    issues.push("No different favicon sizes for different devices")
  }

  return {
    faviconLinks,
    hasDefaultFavicon,
    hasAppleTouchIcon,
    hasDifferentSizes,
    issues,
  }
}

// Check for structured data errors
function validateStructuredData(html: string) {
  const $ = load(html)
  const errors = []

  // Check JSON-LD scripts
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const jsonContent = $(el).html() || "{}"
      JSON.parse(jsonContent)
    } catch (e) {
      errors.push(`Invalid JSON-LD: ${e.message}`)
    }
  })

  // Check for incomplete microdata
  $("[itemscope]").each((i, el) => {
    const hasItemtype = $(el).attr("itemtype") !== undefined
    if (!hasItemtype) {
      errors.push("Element has itemscope but no itemtype")
    }

    // Check for required properties
    const itemtype = $(el).attr("itemtype") || ""
    if (itemtype.includes("Product") && !$(el).find('[itemprop="name"], [itemprop="price"]').length) {
      errors.push("Product schema missing required properties (name, price)")
    }

    if (itemtype.includes("Article") && !$(el).find('[itemprop="headline"]').length) {
      errors.push("Article schema missing required headline property")
    }
  })

  return {
    errors,
    hasErrors: errors.length > 0,
  }
}

// Detect duplicate content on page
function detectDuplicateContent(html: string) {
  const $ = load(html)
  const paragraphs: string[] = []

  // Collect all paragraphs
  $("p").each((i, el) => {
    const text = $(el).text().trim()
    if (text.length > 50) {
      // Only check substantial paragraphs
      paragraphs.push(text)
    }
  })

  // Check for duplicates
  const duplicates: string[] = []
  const seen = new Set<string>()

  paragraphs.forEach((paragraph) => {
    if (seen.has(paragraph)) {
      if (!duplicates.includes(paragraph)) {
        duplicates.push(paragraph)
      }
    } else {
      seen.add(paragraph)
    }
  })

  return {
    hasDuplicates: duplicates.length > 0,
    duplicateCount: duplicates.length,
    duplicates: duplicates.slice(0, 3), // Return only first 3 duplicates
  }
}

// Check for cookie and privacy compliance hints
function checkPrivacyCompliance(html: string) {
  const $ = load(html)

  // Check for cookie consent
  const hasCookieConsent =
    html.includes("cookie consent") ||
    html.includes("cookie policy") ||
    html.includes("cookie banner") ||
    html.includes("gdpr") ||
    $('div[id*="cookie"], div[class*="cookie"]').length > 0

  // Check for privacy policy link
  const hasPrivacyPolicy =
    $('a[href*="privacy"]').length > 0 ||
    $('a:contains("Privacy")').length > 0 ||
    $('a:contains("Privacy Policy")').length > 0

  // Check for terms and conditions
  const hasTerms =
    $('a[href*="terms"]').length > 0 ||
    $('a:contains("Terms")').length > 0 ||
    $('a:contains("Terms of Service")').length > 0

  return {
    hasCookieConsent,
    hasPrivacyPolicy,
    hasTerms,
    isCompliant: hasCookieConsent && hasPrivacyPolicy,
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
    const { images, imageStats, issues: imageIssues } = analyzeImages(html, url)
    const { openGraph, twitter, facebook, hasOpenGraph, hasTwitterCard, issues: socialIssues } = analyzeSocialTags(html)
    const { schemas, schemaTypes, hasSchema, issues: schemaIssues } = analyzeSchemaMarkup(html)
    const {
      internalLinks,
      duplicateLinks,
      linkDistribution,
      stats: internalLinkStats,
      issues: internalLinkIssues,
    } = analyzeInternalLinks(html, url)
    const {
      externalLinks,
      topDomains,
      stats: externalLinkStats,
      issues: externalLinkIssues,
    } = analyzeExternalLinks(html, url)
    const mobileFriendliness = analyzeMobileFriendliness(html)
    const httpsAnalysis = analyzeHttps(url)
    const performance = analyzePerformance(html)
    const { keywordAnalysis, sortedKeywords, stats: keywordStats, issues: keywordIssues } = analyzeKeywords(html, url)
    const canonicalAnalysis = analyzeCanonical(html, url)
    const hreflangAnalysis = analyzeHreflang(html)
    const readability = calculateReadability(html)
    const languageAnalysis = detectLanguage(html)
    const ampAnalysis = detectAmp(html)
    const faviconAnalysis = checkFavicon(html, url)
    const structuredDataValidation = validateStructuredData(html)
    const duplicateContent = detectDuplicateContent(html)
    const privacyCompliance = checkPrivacyCompliance(html)

    // Async checks
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
      ...languageAnalysis.issues,
      ...structuredDataValidation.errors,
    ]

    // Calculate overall score
    const maxScore = 100
    const deductions = Math.min(allIssues.length * 2.5, 70) // Cap deductions at 70 points
    const overallScore = Math.max(0, maxScore - deductions)

    // Categorize issues by severity
    const criticalIssues = allIssues.filter(
      (issue) =>
        issue.includes("No H1") ||
        issue.includes("broken links") ||
        issue.includes("not using HTTPS") ||
        issue.includes("Invalid JSON-LD") ||
        issue.includes("missing lang attribute"),
    )

    const majorIssues = allIssues.filter(
      (issue) =>
        !criticalIssues.includes(issue) &&
        (issue.includes("missing") ||
          issue.includes("too short") ||
          issue.includes("too long") ||
          issue.includes("High number") ||
          issue.includes("No schema markup") ||
          issue.includes("No canonical") ||
          issue.includes("No mobile viewport")),
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

    if (!hasOpenGraph || !hasTwitterCard) {
      recommendations.push("Add complete social media tags for better visibility when shared on social platforms.")
    }

    if (faviconAnalysis.issues.length > 0) {
      recommendations.push("Implement proper favicons for different devices and platforms.")
    }

    if (duplicateContent.hasDuplicates) {
      recommendations.push("Remove duplicate content within the page to improve user experience and SEO.")
    }

    if (!privacyCompliance.isCompliant) {
      recommendations.push("Add cookie consent and privacy policy for legal compliance.")
    }

    if (externalLinks.length > 3 && externalLinkStats.nofollow < externalLinks.length / 2) {
      recommendations.push("Add nofollow attributes to external links to preserve link equity.")
    }

    // Prepare response
    const result = {
      url,
      overallScore,
      timestamp: new Date().toISOString(),

      // Basic SEO factors
      metaTags,
      headings,
      contentAnalysis,
      urlAnalysis,

      // Visual elements
      images: {
        list: images.slice(0, 10), // Only return first 10 images
        stats: imageStats,
      },

      // Social and sharing
      socialTags: {
        openGraph,
        twitter,
        facebook,
        hasOpenGraph,
        hasTwitterCard,
      },

      // Structured data
      schemaMarkup: {
        schemas,
        schemaTypes,
        hasSchema,
        validation: structuredDataValidation,
      },

      // Links
      links: {
        internal: {
          list: internalLinks.slice(0, 15), // Only return first 15 internal links
          stats: internalLinkStats,
          distribution: linkDistribution,
          duplicates: duplicateLinks,
        },
        external: {
          list: externalLinks.slice(0, 10), // Only return first 10 external links
          stats: externalLinkStats,
          topDomains,
        },
        broken: brokenLinks,
      },

      // Mobile and performance
      mobileFriendliness,
      performance,
      ampAnalysis,

      // Security
      security: {
        https: httpsAnalysis,
        privacyCompliance,
      },

      // Technical SEO
      keywords: {
        analysis: sortedKeywords.slice(0, 10), // Only return top 10 keywords
        stats: keywordStats,
      },
      canonical: canonicalAnalysis,
      hreflang: hreflangAnalysis,
      robotsTxt: robotsTxtAnalysis,
      sitemap: sitemapAnalysis,
      favicon: faviconAnalysis,

      // Content quality
      readability,
      language: languageAnalysis,
      duplicateContent,

      // Issues summary
      issues: {
        critical: criticalIssues,
        major: majorIssues,
        minor: minorIssues,
      },

      // Recommendations
      recommendations,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in SEO audit:", error)
    return NextResponse.json({ error: "Failed to perform SEO audit", details: error.message }, { status: 500 })
  }
}

