"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSale } from "@/actions/sales";
import { getProducts, getProduct } from "@/actions/products";
import { getCustomers } from "@/actions/customers";
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
  salePrice: number;
  currentStock: number | null;
}

interface Serial {
  id: string;
  serialNumber: string;
  status: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface LineItem {
  key: string;
  productId: string;
  serialNumber: string;
  unitPrice: number;
  productName: string;
}

let itemKeyCounter = 0;
function nextKey() {
  return `item_${++itemKeyCounter}`;
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

export default function NewSalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentType, setPaymentType] = useState("CASH");
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [serials, setSerials] = useState<Serial[]>([]);
  const [selectedSerial, setSelectedSerial] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);

  useEffect(() => {
    getProducts().then((r) => {
      if (r.success) setProducts(r.data ?? []);
    });
    getCustomers().then((r) => {
      if (r.success) setCustomers(r.data ?? []);
    });
  }, []);

  async function handleProductSelect(productId: string) {
    setSelectedProductId(productId);
    setSelectedSerial("");
    setUnitPrice(0);
    setSerials([]);
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (product) setUnitPrice(product.salePrice);
    const result = await getProduct(productId);
    if (result.success) {
      const available = result.data!.serials.filter(
        (s: Serial) => s.status === "AVAILABLE"
      );
      setSerials(available);
    }
  }

  function addItem() {
    if (!selectedProductId) {
      setError("Mahsulotni tanlang");
      return;
    }
    if (!selectedSerial) {
      setError("Seriya raqamni tanlang");
      return;
    }
    if (unitPrice <= 0) {
      setError("Narx 0 dan katta bo'lishi kerak");
      return;
    }
    const product = products.find((p) => p.id === selectedProductId);
    if (items.some((i) => i.serialNumber === selectedSerial)) {
      setError("Bu seriya raqam allaqachon qo'shilgan");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        productId: selectedProductId,
        serialNumber: selectedSerial,
        unitPrice,
        productName: product?.name || "",
      },
    ]);
    setSelectedProductId("");
    setSelectedSerial("");
    setSerials([]);
    setUnitPrice(0);
    setError("");
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function calcTotal() {
    return items.reduce((sum, item) => sum + item.unitPrice, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Kamida bitta mahsulot qo'shing");
      return;
    }
    if (paymentType === "DEBT" && !customerId) {
      setError("Qarz uchun mijoz tanlanishi shart");
      return;
    }

    setLoading(true);
    try {
      const result = await createSale({
        customerId: customerId || undefined,
        paymentType,
        notes: notes.trim() || undefined,
        dueDate: paymentType === "DEBT" ? new Date(dueDate) : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          serialNumber: item.serialNumber,
          unitPrice: item.unitPrice,
        })),
      });
      if (result.success) {
        router.push("/sales");
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
        <Button variant="ghost" size="icon" onClick={() => router.push("/sales")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.sale.new}</h1>
          <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>{t.sale.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">{t.sale.customer}</Label>
              <Select value={customerId} onValueChange={setCustomerId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={t.sale.customer} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.common.no}</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` (${c.phone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentType">
                {t.sale.paymentType} <span className="text-destructive">*</span>
              </Label>
              <Select value={paymentType} onValueChange={setPaymentType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">{t.sale.cash}</SelectItem>
                  <SelectItem value="CARD">{t.sale.card}</SelectItem>
                  <SelectItem value="UZUM">{t.sale.uzum}</SelectItem>
                  <SelectItem value="DEBT">{t.sale.debt}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentType === "DEBT" && (
              <div className="space-y-2">
                <Label htmlFor="dueDate">{t.debt.dueDate}</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

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
            <CardTitle>{t.sale.items}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>{t.sale.selectProduct}</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={handleProductSelect}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.sale.selectProduct} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                        {product.currentStock !== null && product.currentStock <= 0
                          ? " (zaxira yo'q)"
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.sale.selectSerial}</Label>
                <Select
                  value={selectedSerial}
                  onValueChange={setSelectedSerial}
                  disabled={loading || !selectedProductId || serials.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        serials.length === 0 && selectedProductId
                          ? "Mavjud emas"
                          : t.sale.selectSerial
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {serials.map((s) => (
                      <SelectItem key={s.id} value={s.serialNumber}>
                        {s.serialNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.purchase.unitPrice}</Label>
                <Input
                  type="number"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="button" size="sm" onClick={addItem} disabled={loading}>
              <Plus className="h-4 w-4" />
              Qo'shish
            </Button>

            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Mahsulot qo'shish uchun yuqoridagi tugmani bosing
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">{t.product.name}</TableHead>
                      <TableHead>{t.product.serialNumber}</TableHead>
                      <TableHead className="text-right">{t.purchase.unitPrice}</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>{item.serialNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
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
                  <span className="text-muted-foreground">{t.sale.totalAmount}:</span>
                  <span>{formatCurrency(calcTotal())}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/sales")}
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
