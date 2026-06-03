import { getAllBlocks } from "@/lib/queries/manage"
import BlockList from "@/components/block-list"

export default async function ManageBlocksPage() {
  const blocks = await getAllBlocks()
  return <BlockList blocks={blocks} />
}
