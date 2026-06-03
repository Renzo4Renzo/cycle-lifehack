import { signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-10 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Cycle Lifehack</h1>
        {error && (
          <p className="text-sm text-destructive">
            Access denied — your email is not on the allowlist.
          </p>
        )}
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/" })
          }}
        >
          <Button type="submit" size="lg">
            Sign in with Google
          </Button>
        </form>
      </div>
    </main>
  )
}
