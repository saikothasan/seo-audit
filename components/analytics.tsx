"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"

// Component that uses useSearchParams
function AnalyticsContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      // This is where you would typically add your analytics tracking code
      // For example, Google Analytics or similar services
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")

      // Example of how you might track a page view
      console.log(`Page view: ${url}`)

      // If you had Google Analytics, you might do something like:
      // window.gtag('config', 'GA-MEASUREMENT-ID', {
      //   page_path: url,
      // })
    }
  }, [pathname, searchParams])

  return null
}

// Main component with Suspense boundary
export function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  )
}

