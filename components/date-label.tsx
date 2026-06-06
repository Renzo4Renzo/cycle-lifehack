"use client"

export default function DateLabel({ dateStr, className }: { dateStr: string; className?: string }) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return (
    <span className={className}>
      {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
    </span>
  )
}
