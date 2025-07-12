'use server'

import { db } from "@/lib/db"
import { auth } from "../../auth"
import { revalidatePath } from "next/cache"
import { UserRole } from "@prisma/client"

interface UserUpdateData {
  firstName?: string
  lastName?: string
  currency?: string
}

export async function updateUser(data: UserUpdateData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        currency: data.currency
      }
    })

    revalidatePath("/settings")
    return { success: true, data: updatedUser }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to update user" }
  }
}

export async function getCurrentUser() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    return { success: true, data: user }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch user" }
  }
}
