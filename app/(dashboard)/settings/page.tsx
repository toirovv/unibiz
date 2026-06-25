"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/actions/settings";
import { exportBackup } from "@/actions/import-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { t } from "@/lib/i18n";
import {
  Building2,
  Download,
  Moon,
  Save,
  Sun,
  Send,
  Upload,
  Database,
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");

  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  const [importType, setImportType] = useState("customers");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await getSettings();
      if (result.success && result.data) {
        setBusinessName(result.data.name || "");
        setBusinessSlug(result.data.slug || "");
        setTelegramChatId(result.data.telegramChatId || "");
      }
      const stored = localStorage.getItem("theme");
      setDarkMode(stored === "dark");
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  async function handleSaveBusiness() {
    setSaving(true);
    await updateSettings({ name: businessName, telegramChatId });
    setSaving(false);
  }

  async function handleExport() {
    const result = await exportBackup();
    if (result.success && result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unibiz-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      const { importData } = await import("@/actions/import-export");
      const result = await importData(importType, Array.isArray(data) ? data : [data]);
      if (result.success) {
        alert(`Import qilindi: ${result.count} ta yozuv`);
      }
    } catch {
      alert("Xatolik yuz berdi");
    }
    setImporting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.settings.title}</h1>
        <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            {t.settings.businessName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.settings.businessName}</Label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t.settings.businessSlug}</Label>
            <Input value={businessSlug} readOnly className="bg-muted" />
          </div>
          <Button onClick={handleSaveBusiness} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? t.common.loading : t.settings.saveSettings}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-muted-foreground" />
            Telegram
          </CardTitle>
          <CardDescription>
            Telegram bot orqali bildirishnomalarni olish uchun bot tokeni va chat ID ni kiriting.
            Bot tokenini @BotFather dan olishingiz mumkin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.settings.telegramBotToken}</Label>
            <Input
              type="password"
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              placeholder="1234567890:ABCdefGHIjklmNOPqrstUVwxyz"
            />
          </div>
          <div className="space-y-2">
            <Label>{t.settings.telegramChatId}</Label>
            <Input
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="-1001234567890"
            />
          </div>
          <Button onClick={handleSaveBusiness} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? t.common.loading : t.settings.saveSettings}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            {t.settings.backup.title}
          </CardTitle>
          <CardDescription>{t.settings.backup.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4" />
            {t.settings.backup.download}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-muted-foreground" />
            {t.settings.import.title}
          </CardTitle>
          <CardDescription>{t.settings.import.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.common.status}</Label>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customers">{t.customer.title}</SelectItem>
                <SelectItem value="products">{t.product.title}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.settings.import.selectFile}</Label>
            <Input
              type="file"
              accept=".csv,.xlsx,.json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button onClick={handleImport} disabled={importing || !importFile}>
            {importing ? t.common.loading : t.settings.import.start}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {darkMode ? (
              <Moon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Sun className="h-5 w-5 text-muted-foreground" />
            )}
            {t.settings.darkMode}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {darkMode ? t.theme.dark : t.theme.light}
          </span>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
        </CardContent>
      </Card>
    </div>
  );
}
