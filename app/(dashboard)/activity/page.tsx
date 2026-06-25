"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getActivities } from "@/actions/activity";
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
import { t } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import { Activity, Clock } from "lucide-react";

interface ActivityRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: Date;
}

const actionColor = (action: string) => {
  switch (action) {
    case "CREATE": return "success" as const;
    case "UPDATE": return "warning" as const;
    case "DELETE": return "destructive" as const;
    case "PAYMENT": return "default" as const;
    default: return "secondary" as const;
  }
};

const entityLabel = (type: string) => {
  switch (type) {
    case "customer": return t.customer.title;
    case "product": return t.product.title;
    case "sale": return t.sale.title;
    case "purchase": return t.purchase.title;
    case "debt": return t.debt.title;
    default: return type;
  }
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchActivities() {
    setLoading(true);
    const result = await getActivities();
    if (result.success) {
      setActivities(result.data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.activity.title}</h1>
        <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <Activity className="h-12 w-12" />
          <p>{t.activity.noActivities}</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              {t.activity.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.common.date}</TableHead>
                  <TableHead>{t.common.actions}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t.common.notes}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDateTime(activity.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionColor(activity.action)}>
                        {activity.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entityLabel(activity.entityType)}
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate sm:table-cell text-muted-foreground">
                      {activity.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
