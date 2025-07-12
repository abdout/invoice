'use server'

import { db } from "@/lib/db"
import { auth } from "../../auth"
import { revalidatePath } from "next/cache"
import { Status } from "@prisma/client"

interface AddressData {
  name: string
  email?: string
  address1: string
  address2?: string
  address3?: string
}

interface ItemData {
  item_name: string
  quantity: number
  price: number
  total: number
}

interface InvoiceFormData {
  invoice_no: string
  invoice_date: Date
  due_date: Date
  currency?: string
  from: AddressData
  to: AddressData
  items: ItemData[]
  sub_total: number
  discount?: number
  tax_percentage?: number
  total: number
  notes?: string
  status?: Status
}

export async function createInvoice(data: InvoiceFormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Create addresses first
    const [fromAddress, toAddress] = await Promise.all([
      db.address.create({
        data: data.from
      }),
      db.address.create({
        data: data.to
      })
    ])

    // Create invoice with relationships
    const invoice = await db.invoice.create({
      data: {
        invoice_no: data.invoice_no,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        currency: data.currency || "USD",
        fromAddressId: fromAddress.id,
        toAddressId: toAddress.id,
        sub_total: data.sub_total,
        discount: data.discount,
        tax_percentage: data.tax_percentage,
        total: data.total,
        notes: data.notes,
        status: data.status || "UNPAID",
        userId: session.user.id,
        items: {
          create: data.items
        }
      },
      include: {
        items: true,
        from: true,
        to: true
      }
    })

    revalidatePath("/invoice")
    return { success: true, data: invoice }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to create invoice" }
  }
}

export async function updateInvoice(id: string, data: InvoiceFormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!invoice || invoice.userId !== session.user.id) {
      throw new Error("Invoice not found or unauthorized")
    }

    // Update addresses
    await Promise.all([
      db.address.update({
        where: { id: invoice.fromAddressId },
        data: data.from
      }),
      db.address.update({
        where: { id: invoice.toAddressId },
        data: data.to
      })
    ])

    // Delete existing items and create new ones
    await db.item.deleteMany({
      where: { invoiceId: id }
    })

    const updatedInvoice = await db.invoice.update({
      where: { id },
      data: {
        invoice_no: data.invoice_no,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        currency: data.currency,
        sub_total: data.sub_total,
        discount: data.discount,
        tax_percentage: data.tax_percentage,
        total: data.total,
        notes: data.notes,
        status: data.status,
        items: {
          create: data.items
        }
      },
      include: {
        items: true,
        from: true,
        to: true
      }
    })

    revalidatePath("/invoice")
    return { success: true, data: updatedInvoice }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to update invoice" }
  }
}

export async function getInvoices(page: number = 1, limit: number = 5) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const skip = (page - 1) * limit

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where: { userId: session.user.id },
        include: {
          items: true,
          from: true,
          to: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.invoice.count({
        where: { userId: session.user.id }
      })
    ])

    return {
      success: true,
      data: invoices,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch invoices" }
  }
}

export async function getInvoiceById(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const invoice = await db.invoice.findUnique({
      where: { 
        id,
        userId: session.user.id 
      },
      include: {
        items: true,
        from: true,
        to: true
      }
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" }
    }

    return { success: true, data: invoice }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch invoice" }
  }
}
