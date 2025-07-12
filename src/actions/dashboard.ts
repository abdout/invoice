'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { Status } from "@prisma/client"

export async function getDashboardStats() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const baseQuery = {
      where: {
        userId: session.user.id,
        invoice_date: {
          gte: thirtyDaysAgo
        }
      }
    }

    const [
      invoices,
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      recentInvoices
    ] = await Promise.all([
      db.invoice.findMany({
        ...baseQuery,
        select: {
          invoice_date: true,
          total: true,
          status: true
        }
      }),
      db.invoice.count(baseQuery),
      db.invoice.count({
        where: {
          ...baseQuery.where,
          status: Status.PAID
        }
      }),
      db.invoice.count({
        where: {
          ...baseQuery.where,
          status: Status.UNPAID
        }
      }),
      db.invoice.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        include: {
          from: true,
          to: true
        }
      })
    ])

    const totalRevenue = invoices.reduce((prev: number, curr: { total: number }) => prev + curr.total, 0)

    const chartData = invoices.map((invoice: { invoice_date: Date; total: number; status: Status }) => ({
      date: invoice.invoice_date.toISOString().split('T')[0],
      totalRevenue: invoice.total,
      paidRevenue: invoice.status === Status.PAID ? invoice.total : 0
    }))

    return {
      success: true,
      data: {
        totalRevenue,
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        recentInvoices,
        chartData
      }
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch dashboard stats" }
  }
}
