import { auth } from "@/auth";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { notFound } from "next/navigation";

export default async function ViewInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return notFound();

  const invoice = await db.invoice.findUnique({
    where: {
      id: params.id,
    },
    include: {
      from: true,
      to: true,
      items: true,
    },
  });

  if (!invoice) return notFound();

  const totalAmountInCurrencyFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: invoice.currency || "USD",
  }).format(invoice.total);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Invoice</h1>
            <p className="text-sm text-gray-500">#{invoice.invoice_no}</p>
          </div>
          <Badge>{invoice.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="font-semibold mb-2">From</h2>
            <p>{invoice.from.name}</p>
            <p>{invoice.from.email}</p>
            <div>
              {invoice.from.address1 && <p>{invoice.from.address1}</p>}
              {invoice.from.address2 && <p>{invoice.from.address2}</p>}
              {invoice.from.address3 && <p>{invoice.from.address3}</p>}
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">To</h2>
            <p>{invoice.to.name}</p>
            <p>{invoice.to.email}</p>
            <div>
              {invoice.to.address1 && <p>{invoice.to.address1}</p>}
              {invoice.to.address2 && <p>{invoice.to.address2}</p>}
              {invoice.to.address3 && <p>{invoice.to.address3}</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="font-semibold mb-2">Invoice Date</h2>
            <p>{format(invoice.invoice_date, "PPP")}</p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Due Date</h2>
            <p>{format(invoice.due_date, "PPP")}</p>
          </div>
        </div>

        <Separator className="my-8" />

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Item</th>
              <th className="text-right py-2">Quantity</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => {
              const itemTotal = item.quantity * item.price;
              const itemTotalFormatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: invoice.currency || "USD",
              }).format(itemTotal);
              
              const priceFormatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: invoice.currency || "USD",
              }).format(item.price);

              return (
                <tr key={item.id} className="border-b">
                  <td className="py-2">
                    <p className="font-medium">{item.item_name}</p>
                  </td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">{priceFormatted}</td>
                  <td className="text-right py-2">{itemTotalFormatted}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="font-medium">Total</span>
              <span className="font-bold">{totalAmountInCurrencyFormat}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <>
            <Separator className="my-8" />
            <div>
              <h2 className="font-semibold mb-2">Notes</h2>
              <p className="text-gray-600">{invoice.notes}</p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
