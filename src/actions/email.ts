'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { resend } from "@/lib/email.config"
import { SendInvoiceEmail } from "@/components/template/SendInvoiceEmail"
import { format } from "date-fns"

export async function sendInvoiceEmail(invoiceId: string, subject: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      console.error("Unauthorized attempt to send invoice email")
      return { success: false, error: "Unauthorized" }
    }

    const invoice = await db.invoice.findUnique({
      where: { 
        id: invoiceId,
        userId: session.user.id 
      },
      include: {
        items: true,
        from: true,
        to: true
      }
    })

    if (!invoice) {
      console.error(`Invoice not found: ${invoiceId}`)
      return { success: false, error: "Invoice not found" }
    }

    if (!invoice.to.email) {
      console.error(`Client email missing for invoice: ${invoiceId}`)
      return { success: false, error: "Client email not found" }
    }

    const totalFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD'
    }).format(invoice.total)

    const emailContent = SendInvoiceEmail({
      firstName: invoice.to.name,
      invoiceNo: invoice.invoice_no,
      dueDate: format(invoice.due_date, 'PPP'),
      total: totalFormatted,
      invoiceURL: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/paid/${invoice.id}`
    })

    const { data, error } = await resend.emails.send({
      from: 'Invoice App <onboarding@resend.dev>',
      to: invoice.to.email,
      subject: subject,
      react: emailContent
    })

    if (error) {
      console.error(`Failed to send email for invoice: ${invoiceId}`, error)
      return { success: false, error: error.message || "Failed to send email" }
    }

    console.log(`Email sent successfully for invoice: ${invoiceId}`)
    return { success: true, message: "Email sent successfully" }
  } catch (error) {
    console.error("Error sending invoice email:", error)
    return { success: false, error: "Failed to send email" }
  }
}
