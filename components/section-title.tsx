interface SectionTitleProps {
  title: string
  description: string
  alignment?: "left" | "center"
}

export function SectionTitle({ title, description, alignment = "center" }: SectionTitleProps) {
  return (
    <div className={`space-y-4 ${alignment === "center" ? "text-center" : "text-left"}`}>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className={`text-muted-foreground text-lg ${alignment === "center" ? "mx-auto max-w-[800px]" : ""}`}>
        {description}
      </p>
    </div>
  )
}

