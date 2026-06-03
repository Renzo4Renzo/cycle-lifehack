"use client"
import { useState } from "react"
import Link from "next/link"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteBlock } from "@/lib/actions/manage-actions"
import { cn } from "@/lib/utils"
import type { BlockView } from "@/lib/types"

export default function BlockList({ blocks }: { blocks: BlockView[] }) {
  const [deleteTarget, setDeleteTarget] = useState<BlockView | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link href="/manage/blocks/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-1" /> Add block
        </Link>
      </div>

      {blocks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No blocks yet.</p>
      )}

      {blocks.map((block) => (
        <div key={block.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-sm">{block.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{block.category}</p>
            </div>
            <Badge
              variant="secondary"
              className={
                block.type === "manual"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
              }
            >
              {block.type === "manual" ? "Manual" : "Auto"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/manage/blocks/${block.id}/edit`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(block)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the block and all its cycles and items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) await deleteBlock(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
