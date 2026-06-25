"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDebt, makePayment } from "@/actions/debts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { t } from "@/lib/i18n";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle2,
} from "lucide-react";

interface DebtDetail {
  id: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  status: string;
  customer: { id: string; name: string };
  payments: {
    id: string;
    amount: number;
    note: string | null;
    createdAt: Date;
  }[];
}

export default function DebtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [debt, setDebt] = useState<DebtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchDebt() {
    setLoading(true);
    const result = await getDebt(id);
    if (result.success) {
      setDebt(result.data as DebtDetail);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDebt();
  }, [id]);

  async function handlePayment() {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    setSubmitting(true);
    const result = await makePayment(id, {
      amount,
      note: paymentNote || undefined,
    });
    if (result.success) {
      setDialogOpen(false);
      setPaymentAmount("");
      setPaymentNote("");
      fetchDebt();
    }
    setSubmitting(false);
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "PAID": return "success" as const;
      case "OVERDUE": return "destructive" as const;
      default: return "warning" as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE": return t.debt.status.active;
      case "PAID": return t.debt.status.paid;
      case "OVERDUE": return t.debt.status.overdue;
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t.common.noResults}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/debts")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{debt.customer.name}</h1>
          <p className="text-sm text-muted-foreground">{t.debt.details}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <DollarSign className="h-4 w-4" />
          {t.debt.makePayment}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.debt.totalAmount}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(debt.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.debt.paidAmount}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(debt.paidAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.debt.remainingAmount}</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(debt.remainingAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.common.status}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(debt.status)}>
                {statusLabel(debt.status)}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.debt.dueDate}: {formatDate(debt.dueDate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {debt.remainingAmount <= 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="h-5 w-5" />
          {t.debt.status.paid}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.debt.paymentHistory}</CardTitle>
        </CardHeader>
        <CardContent>
          {debt.payments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t.debt.noPayments}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.common.date}</TableHead>
                  <TableHead className="text-right">{t.debt.paymentAmount}</TableHead>
                  <TableHead>{t.common.notes}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debt.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.note || "-"}
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
            <DialogTitle>{t.debt.makePayment}</DialogTitle>
            <DialogDescription>
              {debt.customer.name} - {t.debt.remainingAmount}: {formatCurrency(debt.remainingAmount)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.debt.paymentAmount}</label>
              <Input
                type="number"
                placeholder="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.common.notes}</label>
              <Input
                placeholder={t.common.notes}
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handlePayment} disabled={submitting || !paymentAmount || Number(paymentAmount) <= 0}>
              {submitting ? t.common.loading : t.debt.makePayment}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
