"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPurchases, deletePurchase } from "@/actions/purchases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Purchase {
  id: string;
  supplierName: string;
  notes: string | null;
  totalAmount: number;
  createdAt: Date;
  itemCount: number;
}

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filtered, setFiltered] = useState<Purchase[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchPurchases() {
    setLoading(true);
    const result = await getPurchases();
    if (result.success) {
      setPurchases(result.data ?? []);
      setFiltered(result.data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPurchases();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      purchases.filter((p) => p.supplierName.toLowerCase().includes(q))
    );
  }, [search, purchases]);

  async function handleDelete(id: string) {
    await deletePurchase(id);
    fetchPurchases();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.purchase.title}</h1>
          <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
        </div>
        <Button onClick={() => router.push("/purchases/new")}>
          <Plus className="h-4 w-4" />
          {t.purchase.new}
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
          <p>{t.purchase.noPurchases}</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.purchase.supplier}</TableHead>
                      <TableHead className="text-right">{t.purchase.items}</TableHead>
                      <TableHead className="text-right">{t.purchase.totalAmount}</TableHead>
                      <TableHead>{t.common.date}</TableHead>
                      <TableHead className="text-right">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                        <TableCell className="text-right">{purchase.itemCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(purchase.totalAmount)}</TableCell>
                        <TableCell>{formatDate(purchase.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/purchases/${purchase.id}`)}
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
                                    {t.purchase.supplier}: {purchase.supplierName}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => handleDelete(purchase.id)}
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
            {filtered.map((purchase) => (
              <Card key={purchase.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{purchase.supplierName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.purchase.items}:</span>
                    <span>{purchase.itemCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.purchase.totalAmount}:</span>
                    <span className="font-medium">{formatCurrency(purchase.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.common.date}:</span>
                    <span>{formatDate(purchase.createdAt)}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/purchases/${purchase.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                      {t.purchase.details}
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
                            {t.purchase.supplier}: {purchase.supplierName}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(purchase.id)}
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
