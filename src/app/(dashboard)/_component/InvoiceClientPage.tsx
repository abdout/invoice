"use client";
import Loading from "@/components/Loading";
import { buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DateTable";
import { cn } from "@/lib/utils";
import { getInvoices } from "@/actions/invoice";
import { sendInvoiceEmail } from "@/actions/email";
import { toast } from "sonner";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Invoice } from "@/types/invoice";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MoreVerticalIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface IInvoiceClientPage {
  currency: string | undefined;
  userId : string | undefined
}

export default function InvoiceClientPage({userId, currency = "USD" }: IInvoiceClientPage) {
  const [data, setData] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPage, setTotalPage] = useState<number>(1);
  const router = useRouter();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await getInvoices(page);

      if (response.success) {
        setData(response.data || []);
        setTotalPage(response.pagination?.pages || 1);
      } else {
        toast.error(response.error || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch invoices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleSendEmail = async (invoiceId: string, subject: string) => {
    try {
      toast.loading("Please wait...");
      const response = await sendInvoiceEmail(invoiceId, subject);

      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send email");
    }
  }

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoice_no",
      header: "Invoice No",
    },
    {
      accessorKey: "invoice_date",
      header: "Date",
      cell: ({ row }) => {
        return format(row.original.invoice_date, "PP");
      },
    },
    {
      accessorKey: "due_date",
      header: "Due",
      cell: ({ row }) => {
        return format(row.original.due_date, "PP");
      },
    },
    {
      accessorKey: "to.name",
      header: "Client Name",
    },
    {
      accessorKey: "total",
      header: "Amount",
      cell: ({ row }) => {
        // Use the invoice's currency if available, fall back to the provided currency or USD
        const currencyCode = row.original.currency || currency || "USD";
        
        const totalAmountInCurrencyFormat = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currencyCode,
        }).format(row.original.total);

        return totalAmountInCurrencyFormat;
      },
    },
    {
       accessorKey : "status",
       header : "Status",
       cell : ({row})=>{
        return <Badge>{row.original.status}</Badge>
       }
    },
    {
      accessorKey: "id",
      header: "Action",
      cell: ({ row }) => {
        const invoiceId = row.original.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <span className="sr-only">Open menu</span>
              <MoreVerticalIcon className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/invoice/view/${invoiceId}`)}>View</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/invoice/edit/${invoiceId}`)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/invoice/paid/${invoiceId}`)}>Paid</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendEmail(invoiceId, `Invoice from ${row.original.from.name}`)}>Send Email</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-xl font-semibold">Invoice</h1>
        <Link
          href={"/invoice/create"}
          className={cn(buttonVariants(), "cursor-pointer")}
        >
          Create Invoice
        </Link>
      </div>

      {/* {data && data.length === 0 && !isLoading && (
        <div className="min-h-60 h-full w-full bg-neutral-100 flex justify-center items-center rounded">
          <p className="font-semibold">No invoice found</p>
        </div>
      )} */}

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <DataTable columns={columns} data={data} />
          {totalPage !== 1 && (
            <div className="my-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={() => setPage(1)} />
                  </PaginationItem>

                  {new Array(totalPage)
                    .fill(null)
                    .map((item, index: number) => {
                      return (
                        <PaginationItem key={index}>
                          <PaginationLink
                            href="#"
                            onClick={() => setPage(index + 1)}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() => setPage(totalPage)}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
