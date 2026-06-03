"use client"
import { useRouter } from "next/navigation"
import CreateBlockForm from "@/components/create-block-form"
import type { BlockView } from "@/lib/types"

export default function EditBlockClient({ block }: { block: BlockView }) {
  const router = useRouter()
  return (
    <div className="py-2">
      <p className="text-sm text-muted-foreground mb-4">Editing &ldquo;{block.name}&rdquo;.</p>
      <CreateBlockForm block={block} onDone={() => router.push("/manage/blocks")} />
    </div>
  )
}
