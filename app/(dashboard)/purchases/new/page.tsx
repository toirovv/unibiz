"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPurchase } from "@/actions/purchases";
import { getProducts } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { t } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  purchasePrice: number;
}

interface LineItem {
  key: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

let itemKeyCounter = 0;
function nextKey() {
  return `item_${++itemKeyCounter}`;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProducts().then((result) => {
      if (result.success) setProducts(result.data ?? []);
    });
  }, []);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { key: nextKey(), productId: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function updateItem(
    key: string,
    field: keyof LineItem,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
  }

  function handleProductChange(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateItem(key, "productId", productId);
    if (product) {
      updateItem(key, "unitPrice", product.purchasePrice);
    }
  }

  function getProductName(productId: string) {
    return products.find((p) => p.id === productId)?.name || "";
  }

  function calcSubtotal(item: LineItem) {
    return item.quantity * item.unitPrice;
  }

  function calcTotal() {
    return items.reduce((sum, item) => sum + calcSubtotal(item), 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!supplierName.trim()) {
      setError("Yetkazib beruvchi nomi majburiy");
      return;
    }
    if (items.length === 0) {
      setError("Kamida bitta mahsulot qo'shing");
      return;
    }
    for (const item of items) {
      if (!item.productId) {
        setError("Barcha mahsulotlarni tanlang");
        return;
      }
      if (item.quantity <= 0) {
        setError("Soni 0 dan katta bo'lishi kerak");
        return;
      }
      if (item.unitPrice < 0) {
        setError("Narx manfiy bo'lishi mumkin emas");
        return;
      }
    }

    setLoading(true);
    try {
      const result = await createPurchase({
        supplierName: supplierName.trim(),
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      if (result.success) {
        router.push("/purchases");
      } else {
        setError(result.error || "Xatolik yuz berdi");
      }
    } catch {
      setError("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/purchases")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.purchase.new}</h1>
          <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>{t.purchase.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">
                {t.purchase.supplier} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="supplier"
                placeholder={t.purchase.supplier}
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t.common.notes}</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={t.common.notes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t.purchase.items}</CardTitle>
              <Button type="button" size="sm" onClick={addItem} disabled={loading}>
                <Plus className="h-4 w-4" />
                {t.common.create === "Yaratish" ? "Qo'shish" : "Qo'shish"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Mahsulot qo'shish uchun yuqoridagi tugmani bosing
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">{t.sale.selectProduct || "Mahsulot"}</TableHead>
                      <TableHead className="text-right">{t.purchase.quantity}</TableHead>
                      <TableHead className="text-right">{t.purchase.unitPrice}</TableHead>
                      <TableHead className="text-right">{t.purchase.subtotal}</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell>
                          <Select
                            value={item.productId}
                            onValueChange={(value) => handleProductChange(item.key, value)}
                            disabled={loading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t.sale.selectProduct || "Mahsulot tanlang"} />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            className="w-20 text-right"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.key, "quantity", Number(e.target.value))
                            }
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            className="w-28 text-right"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(item.key, "unitPrice", Number(e.target.value))
                            }
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(calcSubtotal(item))}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.key)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-4 flex justify-end">
                <div className="flex items-center gap-4 text-lg font-bold">
                  <span className="text-muted-foreground">{t.purchase.totalAmount}:</span>
                  <span>{formatCurrency(calcTotal())}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/purchases")}
            disabled={loading}
          >
            {t.common.cancel}
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
