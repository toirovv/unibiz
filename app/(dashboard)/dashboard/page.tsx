import { getDashboardStats } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DollarSign,
  Users,
  Package,
  CreditCard,
  TrendingUp,
  Clock,
} from "lucide-react";

export default async function DashboardPage() {
  const result = await getDashboardStats();

  if (!result.success) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t.common.noResults}</p>
      </div>
    );
  }

  const data = result.data!;

  const statCards = [
    {
      title: t.dashboard.todaySales,
      value: formatCurrency(data.todaySales),
      icon: DollarSign,
      description: t.dashboard.revenue,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: t.dashboard.totalCustomers,
      value: data.totalCustomers.toLocaleString(),
      icon: Users,
      description: t.dashboard.totalCustomers,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: t.dashboard.totalProducts,
      value: data.totalProducts.toLocaleString(),
      icon: Package,
      description: t.dashboard.totalProducts,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-900/30",
    },
    {
      title: t.dashboard.activeDebts,
      value: data.activeDebts.toLocaleString(),
      icon: CreditCard,
      description: t.dashboard.debtCollection,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.nav.dashboard}</h1>
        <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              {t.dashboard.recentSales}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentSales.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t.sale.noSales}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.common.date}</TableHead>
                    <TableHead>{t.sale.customer}</TableHead>
                    <TableHead>{t.sale.paymentType}</TableHead>
                    <TableHead className="text-right">{t.common.total}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentSales.map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell className="text-xs">
                        {formatDateTime(sale.createdAt)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {sale.customer?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.paymentType === "DEBT"
                              ? "warning"
                              : sale.paymentType === "CARD"
                                ? "secondary"
                                : "success"
                          }
                        >
                          {t.sale[sale.paymentType?.toLowerCase() as keyof typeof t.sale] || sale.paymentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {formatCurrency(sale.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              {t.dashboard.topProducts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t.product.noProducts}
              </p>
            ) : (
              <div className="space-y-4">
                {data.topProducts.map((item: any, index: number) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.product.salePrice)}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      {item.count} {t.purchase.items.toLowerCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
