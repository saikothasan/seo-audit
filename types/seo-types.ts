export interface SEOIssue {
  title: string
  description: string
  severity: "good" | "warning" | "error"
  category: string
  recommendation?: string
  elements?: string[]
  impact?: "high" | "medium" | "low"
  resourceLinks?: { title: string; url: string }[]
}

export interface CategoryScore {
  name: string
  score: number
  issueCount: number
}

export interface SEOAuditResult {
  url: string
  score: number
  passedChecks: number
  warningChecks: number
  errorChecks: number
  categoryScores: CategoryScore[]
  issues: SEOIssue[]
  timestamp: string
  scanDuration: number
  pageTitle: string
  pageScreenshot?: string
}

export interface MetaTags {
  title?: string
  description?: string
  keywords?: string
  viewport?: string
  robots?: string
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  ogUrl?: string
  ogSiteName?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  twitterSite?: string
  twitterCreator?: string
  author?: string
  language?: string
  themeColor?: string
  indexability?: {
    noindex: boolean
    nofollow: boolean
    noarchive: boolean
    nosnippet: boolean
  }
}

export interface HeadingStructure {
  h1: string[]
  h2: string[]
  h3: string[]
  h4: string[]
  h5: string[]
  h6: string[]
  nestedStructure?: boolean
}

export interface ImageInfo {
  src: string
  alt: string
  hasAlt: boolean
  width?: number | string
  height?: number | string
  size?: number
  format?: string
  lazyLoaded?: boolean
  hasWidthHeight?: boolean
  isLazyLoaded?: boolean
  hasResponsiveConfig?: boolean
  isInlineBase64?: boolean
  fileExtension?: string
  title?: string
}

export interface LinkInfo {
  href: string
  text: string
  isInternal: boolean
  hasText: boolean
  nofollow: boolean
  target?: string
  status?: number
  url?: string
  path?: string
  isNofollow?: boolean
  isCurrentPage?: boolean
  isGeneric?: boolean
  hasTitle?: boolean
  inNavigation?: boolean
  inFooter?: boolean
  inMainContent?: boolean
  hostname?: string
  isSponsored?: boolean
  isUGC?: boolean
  hasSafeRel?: boolean
  hasExternalIndicator?: boolean
  hasIcon?: boolean
  error?: string
}

export interface StructuredData {
  type: string
  valid: boolean
  errors?: string[]
  content?: string
}

export interface PerformanceMetrics {
  loadTime: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  cumulativeLayoutShift?: number
  totalBlockingTime?: number
  speedIndex?: number
}

export interface SecurityInfo {
  hasSSL: boolean
  hasMixedContent: boolean
  securityHeaders: {
    [key: string]: string | null
  }
}

export interface WebsiteData {
  url: string
  statusCode: number
  redirectChain: string[]
  title: string
  metaTags: MetaTags
  headings: HeadingStructure
  images: ImageInfo[]
  links: LinkInfo[]
  contentLength: number
  wordCount: number
  textToHtmlRatio: number
  performance: PerformanceMetrics
  security: SecurityInfo
  structuredData: StructuredData[]
  hasSitemap: boolean
  hasRobotsTxt: boolean
  mobileCompatible: boolean
  brokenLinks: LinkInfo[]
  serverInfo: {
    server?: string
    poweredBy?: string
    contentType?: string
    cacheControl?: string
  }
  cssFiles: string[]
  jsFiles: string[]
  keywords: {
    word: string
    count: number
    density: number
  }[]
}

