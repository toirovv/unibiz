"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProduct, deleteProduct, addSerials } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { t } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Tag,
  Package,
  Barcode,
  Layers,
  Plus,
} from "lucide-react";

interface Serial {
  id: string;
  serialNumber: string;
  status: string;
}

interface ProductDetail {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  purchasePrice: number;
  salePrice: number;
  currentStock: number | null;
  serials: Serial[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSerials, setNewSerials] = useState("");
  const [addingSerials, setAddingSerials] = useState(false);

  async function fetchProduct() {
    setLoading(true);
    const result = await getProduct(id);
    if (result.success) {
      setProduct(result.data as ProductDetail);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function handleDelete() {
    await deleteProduct(id);
    router.push("/products");
  }

  async function handleAddSerials() {
    const serials = newSerials
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (serials.length === 0) return;

    setAddingSerials(true);
    try {
      const result = await addSerials(id, serials);
      if (result.success) {
        setDialogOpen(false);
        setNewSerials("");
        fetchProduct();
      }
    } finally {
      setAddingSerials(false);
    }
  }

  function stockVariant(stock: number | null) {
    if (stock === null || stock === 0) return "destructive" as const;
    if (stock < 5) return "warning" as const;
    return "success" as const;
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t.common.noResults}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/products")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-sm text-muted-foreground">{t.product.details}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/products/${id}/edit`)}>
            <Edit className="h-4 w-4" />
            {t.common.edit}
          </Button>
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
                  {t.product.name}: {product.name}
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
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              {t.product.details}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Barcode className="h-4 w-4" />
                  {t.product.sku}
                </div>
                <p className="font-medium">{product.sku}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  {t.product.category}
                </div>
                <p className="font-medium">{product.category || "-"}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.product.purchasePrice}</p>
                <p className="font-medium">{formatCurrency(product.purchasePrice)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.product.salePrice}</p>
                <p className="font-medium">{formatCurrency(product.salePrice)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.product.stock}</p>
                <Badge variant={stockVariant(product.currentStock)}>
                  {product.currentStock ?? 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-muted-foreground" />
              {t.product.serialNumbers}
            </CardTitle>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              {t.product.addSerial}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {product.serials.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t.product.serialNumbers} yo'q
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{t.product.serialNumber}</TableHead>
                  <TableHead>{t.product.serialStatus}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.serials.map((serial, index) => (
                  <TableRow key={serial.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-mono">{serial.serialNumber}</TableCell>
                    <TableCell>
                      <Badge
                        variant={serial.status === "AVAILABLE" ? "success" : "secondary"}
                      >
                        {serial.status === "AVAILABLE"
                          ? t.product.available
                          : t.product.sold}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.product.addSerial}</DialogTitle>
            <DialogDescription>
              {t.product.serialNumbers} (har bir qatorga bittadan)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="new-serial-numbers">{t.product.serialNumbers}</Label>
            <textarea
              id="new-serial-numbers"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={t.product.serialNumbers}
              value={newSerials}
              onChange={(e) => setNewSerials(e.target.value)}
              disabled={addingSerials}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={addingSerials}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={handleAddSerials} disabled={addingSerials}>
              {addingSerials ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t.product.addSerial}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
