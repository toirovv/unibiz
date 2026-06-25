"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSale, deleteSale } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { t } from "@/lib/i18n";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, ShoppingCart, Trash2, ExternalLink } from "lucide-react";

interface Product {
  id: string;
  name: string;
}

interface SaleItem {
  id: string;
  productId: string;
  serialNumber: string;
  unitPrice: number;
  product: Product;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface Debt {
  id: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  status: string;
}

interface SaleDetail {
  id: string;
  customerId: string | null;
  customer: Customer | null;
  totalAmount: number;
  paymentType: string;
  status: string | null;
  notes: string | null;
  createdAt: Date;
  items: SaleItem[];
  debt: Debt | null;
}

const paymentBadge = (type: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    CASH: { label: t.sale.cash, cls: "bg-green-100 text-green-800 hover:bg-green-100" },
    CARD: { label: t.sale.card, cls: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
    UZUM: { label: t.sale.uzum, cls: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
    DEBT: { label: t.sale.debt, cls: "bg-red-100 text-red-800 hover:bg-red-100" },
  };
  const m = map[type] || { label: type, cls: "" };
  return <Badge className={m.cls}>{m.label}</Badge>;
};

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchSale() {
    setLoading(true);
    const result = await getSale(id);
    if (result.success) {
      setSale(result.data as SaleDetail);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSale();
  }, [id]);

  async function handleDelete() {
    await deleteSale(id);
    router.push("/sales");
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t.common.noResults}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/sales")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {sale.customer?.name || "-"}
          </h1>
          <p className="text-sm text-muted-foreground">{t.sale.details}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4" />
              {t.common.delete}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.common.confirm}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.sale.customer}: {sale.customer?.name || "-"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleDelete}
              >
                {t.common.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              {t.sale.details}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.sale.customer}</p>
                <p className="font-medium">{sale.customer?.name || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.common.date}</p>
                <p className="font-medium">{formatDateTime(sale.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.sale.paymentType}</p>
                <div>{paymentBadge(sale.paymentType)}</div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.sale.totalAmount}</p>
                <p className="font-medium">{formatCurrency(sale.totalAmount)}</p>
              </div>
            </div>
            {sale.notes && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.common.notes}</p>
                <p className="text-sm">{sale.notes}</p>
              </div>
            )}
            {sale.debt && (
              <div className="space-y-1 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/debts/${sale.debt!.id}`)}
                >
                  <ExternalLink className="h-4 w-4" />
                  {t.debt.details}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.sale.items}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t.product.name}</TableHead>
                <TableHead>{t.product.serialNumber}</TableHead>
                <TableHead className="text-right">{t.purchase.unitPrice}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell>{item.serialNumber}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-end">
            <div className="flex items-center gap-4 text-lg font-bold">
              <span className="text-muted-foreground">{t.sale.totalAmount}:</span>
              <span>{formatCurrency(sale.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
