import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    firstName?: string
    lastName?: string
    currency?: string
    role: string
  }
  
  interface Session {
    user: User & {
      id: string
      firstName?: string
      lastName?: string
      currency?: string
      role: string
    }
  }
}
