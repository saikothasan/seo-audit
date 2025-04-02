import {
  Search,
  Smartphone,
  Link2,
  FileText,
  Image,
  Heading1,
  Layers,
  AlertTriangle,
  Gauge,
  Shield,
  Globe,
  Code,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function Features() {
  const features = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Meta Tags Analysis",
      description: "Checks title, description, and other meta tags for SEO best practices",
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Mobile Friendliness",
      description: "Evaluates if your site is optimized for mobile devices",
    },
    {
      icon: <Link2 className="h-6 w-6" />,
      title: "Link Structure",
      description: "Analyzes internal and external links for SEO impact",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Content Quality",
      description: "Examines content for readability and keyword optimization",
    },
    {
      icon: <Image className="h-6 w-6" />,
      title: "Image Optimization",
      description: "Checks if images have alt text and are properly optimized",
    },
    {
      icon: <Heading1 className="h-6 w-6" />,
      title: "Heading Structure",
      description: "Evaluates heading tags (H1, H2, etc.) for proper hierarchy",
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Site Structure",
      description: "Analyzes site architecture for search engine crawlability",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Security Analysis",
      description: "Checks SSL certificates and security headers",
    },
    {
      icon: <Gauge className="h-6 w-6" />,
      title: "Performance",
      description: "Measures page load speed and other performance metrics",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "International SEO",
      description: "Checks hreflang tags and language declarations",
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "Structured Data",
      description: "Validates structured data markup for rich snippets",
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: "SEO Issues",
      description: "Identifies critical SEO problems that need immediate attention",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {features.map((feature, index) => (
        <Card key={index} className="card-hover border-none shadow-sm">
          <CardContent className="flex flex-col items-center text-center p-6">
            <div className="p-3 bg-primary/10 rounded-full mb-4">{feature.icon}</div>
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

