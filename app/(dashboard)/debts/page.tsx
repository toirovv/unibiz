"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDebts } from "@/actions/debts";
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
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { t } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Eye, Search, CreditCard } from "lucide-react";

interface DebtRecord {
  id: string;
  customerId: string;
  totalAmount: number;
  paidAmount: number | null;
  remainingAmount: number;
  dueDate: Date;
  status: string | null;
  customer: { id: string; name: string } | null;
}

const statusVariant = (status: string | null) => {
  switch (status) {
    case "ACTIVE": return "warning" as const;
    case "PAID": return "success" as const;
    case "OVERDUE": return "destructive" as const;
    default: return "default" as const;
  }
};

const statusLabel = (status: string | null) => {
  switch (status) {
    case "ACTIVE": return t.debt.status.active;
    case "PAID": return t.debt.status.paid;
    case "OVERDUE": return t.debt.status.overdue;
    default: return status ?? "-";
  }
};

export default function DebtsPage() {
  const router = useRouter();
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [filtered, setFiltered] = useState<DebtRecord[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);

  async function fetchDebts() {
    setLoading(true);
    const result = await getDebts();
    if (result.success) {
      setDebts(result.data ?? []);
      setFiltered(result.data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDebts();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let list = debts;
    if (tab !== "all") {
      list = list.filter((d) => d.status === tab.toUpperCase());
    }
    if (q) {
      list = list.filter(
        (d) => d.customer && d.customer.name.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [search, debts, tab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.debt.title}</h1>
        <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
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

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">{t.common.all}</TabsTrigger>
          <TabsTrigger value="active">{t.debt.status.active}</TabsTrigger>
          <TabsTrigger value="paid">{t.debt.status.paid}</TabsTrigger>
          <TabsTrigger value="overdue">{t.debt.status.overdue}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <CreditCard className="h-12 w-12" />
              <p>{t.debt.noDebts}</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.customer.name}</TableHead>
                      <TableHead className="text-right">{t.debt.totalAmount}</TableHead>
                      <TableHead className="text-right">{t.debt.paidAmount}</TableHead>
                      <TableHead className="text-right">{t.debt.remainingAmount}</TableHead>
                      <TableHead>{t.debt.dueDate}</TableHead>
                      <TableHead>{t.common.status}</TableHead>
                      <TableHead className="text-right">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium">
                          {debt.customer?.name || "-"}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(debt.totalAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(debt.paidAmount)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(debt.remainingAmount)}</TableCell>
                        <TableCell>{formatDate(debt.dueDate)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(debt.status)}>
                            {statusLabel(debt.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/debts/${debt.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
