"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/layout/command-palette";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      <div className="flex flex-col lg:pl-64">
        <Navbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onSearchToggle={() => setSearchOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
