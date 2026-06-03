"use client"
import { useRouter } from "next/navigation"
import CreateBlockForm from "@/components/create-block-form"

export default function NewBlockPage() {
  const router = useRouter()
  return (
    <div className="py-2">
      <p className="text-sm text-muted-foreground mb-4">Fill in the details below, then save.</p>
      <CreateBlockForm onDone={() => router.push("/manage/blocks")} />
    </div>
  )
}
