"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPurchase, deletePurchase } from "@/actions/purchases";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, ShoppingCart, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
}

interface PurchaseItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: Product;
}

interface PurchaseDetail {
  id: string;
  supplierName: string;
  notes: string | null;
  totalAmount: number;
  createdAt: Date;
  items: PurchaseItem[];
}

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchPurchase() {
    setLoading(true);
    const result = await getPurchase(id);
    if (result.success) {
      setPurchase(result.data as PurchaseDetail);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPurchase();
  }, [id]);

  async function handleDelete() {
    await deletePurchase(id);
    router.push("/purchases");
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t.common.noResults}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/purchases")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{purchase.supplierName}</h1>
          <p className="text-sm text-muted-foreground">{t.purchase.details}</p>
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
                {t.purchase.supplier}: {purchase.supplierName}
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
              {t.purchase.details}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.purchase.supplier}</p>
                <p className="font-medium">{purchase.supplierName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.common.date}</p>
                <p className="font-medium">{formatDateTime(purchase.createdAt)}</p>
              </div>
            </div>
            {purchase.notes && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.common.notes}</p>
                <p className="text-sm">{purchase.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.purchase.items}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t.product.name}</TableHead>
                <TableHead className="text-right">{t.purchase.quantity}</TableHead>
                <TableHead className="text-right">{t.purchase.unitPrice}</TableHead>
                <TableHead className="text-right">{t.purchase.subtotal}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-end">
            <div className="flex items-center gap-4 text-lg font-bold">
              <span className="text-muted-foreground">{t.purchase.totalAmount}:</span>
              <span>{formatCurrency(purchase.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
