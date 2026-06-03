import { getBlockById } from "@/lib/queries/manage"
import { notFound } from "next/navigation"
import EditBlockClient from "./edit-client"

export default async function EditBlockPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const block = await getBlockById(id)
  if (!block) notFound()
  return <EditBlockClient block={block} />
}
