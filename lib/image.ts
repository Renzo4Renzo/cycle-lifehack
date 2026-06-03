export function getImageUrl(imagePath: string | null, itemName?: string): string {
  if (!imagePath) {
    const seed = encodeURIComponent(itemName ?? "default")
    return `https://picsum.photos/seed/${seed}/300/300`
  }
  if (imagePath.startsWith("http")) return imagePath
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cycle-images/${imagePath}`
}
