"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSales, deleteSale } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { Eye, Plus, Search, Trash2, ShoppingCart } from "lucide-react";

interface Customer {
  id: string;
  name: string;
}

interface Sale {
  id: string;
  customerId: string | null;
  customer: Customer | null;
  totalAmount: number;
  paymentType: string;
  notes: string | null;
  createdAt: Date;
  itemCount: number;
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

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filtered, setFiltered] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchSales() {
    setLoading(true);
    const result = await getSales();
    if (result.success) {
      setSales(result.data ?? []);
      setFiltered(result.data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      sales.filter((s) => {
        const name = s.customer?.name || "";
        return name.toLowerCase().includes(q);
      })
    );
  }, [search, sales]);

  async function handleDelete(id: string) {
    await deleteSale(id);
    fetchSales();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.sale.title}</h1>
          <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
        </div>
        <Button onClick={() => router.push("/sales/new")}>
          <Plus className="h-4 w-4" />
          {t.sale.new}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t.common.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <ShoppingCart className="h-12 w-12" />
          <p>{t.sale.noSales}</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.sale.customer}</TableHead>
                      <TableHead className="text-right">{t.purchase.items}</TableHead>
                      <TableHead className="text-right">{t.sale.totalAmount}</TableHead>
                      <TableHead>{t.sale.paymentType}</TableHead>
                      <TableHead>{t.common.date}</TableHead>
                      <TableHead className="text-right">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">
                          {sale.customer?.name || "-"}
                        </TableCell>
                        <TableCell className="text-right">{sale.itemCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                        <TableCell>{paymentBadge(sale.paymentType)}</TableCell>
                        <TableCell>{formatDate(sale.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/sales/${sale.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
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
                                    onClick={() => handleDelete(sale.id)}
                                  >
                                    {t.common.delete}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((sale) => (
              <Card key={sale.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {sale.customer?.name || "-"}
                    </CardTitle>
                    {paymentBadge(sale.paymentType)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.purchase.items}:</span>
                    <span>{sale.itemCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.sale.totalAmount}:</span>
                    <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.common.date}:</span>
                    <span>{formatDate(sale.createdAt)}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/sales/${sale.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                      {t.sale.details}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Trash2 className="h-4 w-4 text-destructive" />
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
                            onClick={() => handleDelete(sale.id)}
                          >
                            {t.common.delete}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
