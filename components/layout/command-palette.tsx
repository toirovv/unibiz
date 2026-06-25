"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Package, DollarSign } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { t } from "@/lib/i18n";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickActions = [
  { id: "dashboard", label: t.nav.dashboard, href: "/dashboard", icon: Search },
  { id: "customers", label: t.nav.customers, href: "/customers", icon: Users },
  { id: "products", label: t.nav.products, href: "/products", icon: Package },
  { id: "debts", label: t.nav.debts, href: "/debts", icon: DollarSign },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={t.common.search}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{t.common.noResults}</CommandEmpty>
        <CommandGroup heading="Sahifalar">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem key={action.id} onSelect={() => handleSelect(action.href)}>
                <Icon className="mr-2 h-4 w-4" />
                {action.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
