"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCustomer, deleteCustomer } from "@/actions/customers";
import { getDebts } from "@/actions/debts";
import { getSales } from "@/actions/sales";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { t } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CreditCard,
  Edit,
  Phone,
  MapPin,
  FileText,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";

interface CustomerDetail {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  debtTotal: number;
  createdAt: Date;
}

interface DebtRecord {
  id: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  status: string;
  createdAt: Date;
}

interface SaleRecord {
  id: string;
  totalAmount: number;
  paymentType: string;
  createdAt: Date;
  customer: { name: string } | null;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const [customerRes, debtsRes, salesRes] = await Promise.all([
      getCustomer(id),
      getDebts(),
      getSales(),
    ]);

    if (customerRes.success) {
      setCustomer(customerRes.data as CustomerDetail);
    }

    if (debtsRes.success) {
      setDebts(
        (debtsRes.data as DebtRecord[]).filter((d: any) => d.customerId === id)
      );
    }

    if (salesRes.success) {
      setSales(
        (salesRes.data as SaleRecord[]).filter((s: any) => s.customerId === id)
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  async function handleDelete() {
    await deleteCustomer(id);
    router.push("/customers");
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "success" as const;
      case "OVERDUE":
        return "destructive" as const;
      default:
        return "warning" as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return t.debt.status.active;
      case "PAID":
        return t.debt.status.paid;
      case "OVERDUE":
        return t.debt.status.overdue;
      default:
        return status;
    }
  };

  const paymentLabel = (type: string) => {
    switch (type) {
      case "CASH":
        return t.sale.cash;
      case "CARD":
        return t.sale.card;
      case "UZUM":
        return t.sale.uzum;
      case "DEBT":
        return t.sale.debt;
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t.common.noResults}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/customers")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{t.customer.details}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/customers/${id}/edit`)}>
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
                  {t.customer.name}: {customer.name}
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
              <User className="h-5 w-5 text-muted-foreground" />
              {t.customer.details}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {t.customer.phone}
                </div>
                <p className="font-medium">{customer.phone || "-"}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {t.customer.address}
                </div>
                <p className="font-medium">{customer.address || "-"}</p>
              </div>
            </div>
            {customer.notes && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {t.common.notes}
                </div>
                <p className="text-sm">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              {t.debt.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(customer.debtTotal)}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t.customer.debtAmount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            {t.debt.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t.debt.noDebts}
            </p>
          ) : (
            <div className="space-y-4">
              {debts.map((debt) => (
                <div
                  key={debt.id}
                  className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(debt.totalAmount)}</span>
                      <Badge variant={statusVariant(debt.status)}>
                        {statusLabel(debt.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.debt.dueDate}: {formatDate(debt.dueDate)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">{t.debt.paidAmount}: {formatCurrency(debt.paidAmount)}</p>
                    <p className="font-medium">{t.debt.remainingAmount}: {formatCurrency(debt.remainingAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            {t.sale.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t.sale.noSales}
            </p>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{formatCurrency(sale.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(sale.createdAt)}</p>
                  </div>
                  <Badge
                    variant={
                      sale.paymentType === "DEBT"
                        ? "warning"
                        : sale.paymentType === "CARD"
                          ? "secondary"
                          : "success"
                    }
                  >
                    {paymentLabel(sale.paymentType)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
