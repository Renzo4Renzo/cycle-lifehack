export function getCategories(): string[] {
  return (process.env.NEXT_PUBLIC_CATEGORIES ?? "outfits,food")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
}
