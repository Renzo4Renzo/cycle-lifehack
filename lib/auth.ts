import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    signIn({ user }) {
      const allowed =
        process.env.ALLOWED_EMAILS?.split(",").map((e) => e.trim()) ?? []
      return allowed.includes(user.email ?? "")
    },
  },
})
