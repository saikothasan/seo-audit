import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-16 w-16 animate-spin mb-6 text-primary" />
          <p className="text-xl font-medium mb-2">Loading...</p>
          <p className="text-muted-foreground">Please wait while we prepare your results.</p>
        </CardContent>
      </Card>
    </div>
  )
}

