import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { cn } from "@/lib/utils"
import { Analytics } from "@/components/analytics"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "SEO Audit Tool - Professional Website Analysis",
  description:
    "Free comprehensive SEO audit tool to analyze your website's performance and get actionable insights to improve search rankings",
  keywords: "SEO audit, website analysis, SEO tool, search engine optimization, website performance, SEO checker",
  authors: [{ name: "SEO Audit Tool Team" }],
  creator: "SEO Audit Tool",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://seo-audit-tool.com",
    title: "SEO Audit Tool - Professional Website Analysis",
    description: "Free comprehensive SEO audit tool to analyze your website's performance",
    siteName: "SEO Audit Tool",
  },
  twitter: {
    card: "summary_large_image",
    title: "SEO Audit Tool - Professional Website Analysis",
    description: "Free comprehensive SEO audit tool to analyze your website's performance",
    creator: "@seoaudittool",
  },
  metadataBase: new URL("https://seo-audit-tool.com"),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}

