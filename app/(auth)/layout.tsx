import { t } from "@/lib/i18n";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t.app.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.app.tagline}</p>
      </div>
      {children}
    </div>
  );
}
