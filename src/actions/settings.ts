'use server'

import { db } from "@/lib/db"
import { auth } from "../../auth"
import { revalidatePath } from "next/cache"

interface SignatureData {
  name?: string
  image?: string
}

interface SettingsFormData {
  invoiceLogo?: string
  signature?: SignatureData
}

export async function updateSettings(data: SettingsFormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const currentSettings = await db.settings.findUnique({
      where: { userId: session.user.id },
      include: { signature: true }
    })

    if (currentSettings) {
      // Update existing settings
      const updatedSettings = await db.settings.update({
        where: { userId: session.user.id },
        data: {
          invoiceLogo: data.invoiceLogo,
          signature: data.signature ? {
            upsert: {
              create: data.signature,
              update: data.signature
            }
          } : undefined
        },
        include: { signature: true }
      })

      revalidatePath("/settings")
      return { success: true, data: updatedSettings }
    }

    // Create new settings
    const newSettings = await db.settings.create({
      data: {
        userId: session.user.id,
        invoiceLogo: data.invoiceLogo,
        signature: data.signature ? {
          create: data.signature
        } : undefined
      },
      include: { signature: true }
    })

    revalidatePath("/settings")
    return { success: true, data: newSettings }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to update settings" }
  }
}

export async function getSettings() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const settings = await db.settings.findUnique({
      where: { userId: session.user.id },
      include: { signature: true }
    })

    return { success: true, data: settings }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch settings" }
  }
}
