"use client";
export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";

const DashboardShell = nextDynamic(
  () => import("@/components/layout/dashboard-shell"),
  { ssr: false }
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
