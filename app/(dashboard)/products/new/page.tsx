"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createProduct } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { generateSku } from "@/lib/utils";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";

interface FormData {
  name: string;
  sku: string;
  category: string;
  purchasePrice: string;
  salePrice: string;
  serials: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [skuGenerated, setSkuGenerated] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>();

  function handleGenerateSku() {
    const name = getValues("name");
    if (!name.trim()) return;
    const sku = generateSku(name);
    setValue("sku", sku);
    setSkuGenerated(true);
  }

  async function onSubmit(data: FormData) {
    setError("");

    if (!data.name.trim()) {
      setError("Nomi majburiy maydon");
      return;
    }
    if (!data.sku.trim()) {
      setError("SKU majburiy maydon");
      return;
    }
    const purchasePrice = Number(data.purchasePrice);
    const salePrice = Number(data.salePrice);
    if (!purchasePrice || purchasePrice <= 0) {
      setError("Sotib olish narxi majburiy maydon");
      return;
    }
    if (!salePrice || salePrice <= 0) {
      setError("Sotish narxi majburiy maydon");
      return;
    }

    setLoading(true);

    try {
      const serials = data.serials
        ? data.serials
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

      const result = await createProduct({
        name: data.name.trim(),
        sku: data.sku.trim(),
        category: data.category.trim() || undefined,
        purchasePrice,
        salePrice,
        serials,
      });

      if (result.success) {
        router.push("/products");
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
        <Button variant="ghost" size="icon" onClick={() => router.push("/products")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.product.new}</h1>
          <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{t.product.details}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t.product.name} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder={t.product.name}
                {...register("name")}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">
                {t.product.sku} <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  placeholder={t.product.sku}
                  className="flex-1"
                  {...register("sku")}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateSku}
                  disabled={loading}
                  title="SKU yaratish"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t.product.category}</Label>
              <Input
                id="category"
                placeholder={t.product.category}
                {...register("category")}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">
                  {t.product.purchasePrice} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("purchasePrice")}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">
                  {t.product.salePrice} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="salePrice"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("salePrice")}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serials">{t.product.serialNumbers}</Label>
              <textarea
                id="serials"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={t.product.serialNumbers + " (har bir qatorga bittadan)"}
                {...register("serials")}
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/products")}
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
        </CardContent>
      </Card>
    </div>
  );
}
