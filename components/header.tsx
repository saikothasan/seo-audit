"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Github, Menu, X, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const isActive = (path: string) => pathname === path

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-background",
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
              <BarChart2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl hidden sm:inline-block">SEO Audit Tool</span>
              <span className="font-bold text-xl sm:hidden">SEO Tool</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/") ? "text-primary" : "text-muted-foreground",
              )}
            >
              Home
            </Link>
            <Link
              href="/api-docs"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/api-docs") ? "text-primary" : "text-muted-foreground",
              )}
            >
              API Docs
            </Link>
            <Link
              href="/about"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/about") ? "text-primary" : "text-muted-foreground",
              )}
            >
              About
            </Link>
            <div className="flex items-center space-x-2">
              <ModeToggle />
              <Button variant="outline" size="icon" asChild>
                <Link href="https://github.com" target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </Link>
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu} aria-label="Toggle Menu">
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-fade-in">
          <div className="px-4 py-3 space-y-1 bg-background border-b">
            <Link
              href="/"
              className={cn(
                "block py-2 px-3 rounded-md text-base font-medium transition-colors",
                isActive("/") ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground",
              )}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            <Link
              href="/api-docs"
              className={cn(
                "block py-2 px-3 rounded-md text-base font-medium transition-colors",
                isActive("/api-docs") ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground",
              )}
              onClick={closeMobileMenu}
            >
              API Docs
            </Link>
            <Link
              href="/about"
              className={cn(
                "block py-2 px-3 rounded-md text-base font-medium transition-colors",
                isActive("/about") ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground",
              )}
              onClick={closeMobileMenu}
            >
              About
            </Link>
            <div className="py-2 px-3">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="https://github.com" target="_blank" rel="noreferrer" onClick={closeMobileMenu}>
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

