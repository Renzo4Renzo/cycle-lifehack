import { redirect } from "next/navigation"
import { getCategories } from "@/lib/categories"

export default function AppRoot() {
  const [first] = getCategories()
  redirect(`/${first ?? "outfits"}`)
}
