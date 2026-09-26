import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="container-page flex h-20 items-center justify-center">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-lg border border-border bg-bg p-6 shadow-[var(--shadow-card)] sm:p-8">
          {children}
        </div>
      </main>
      <footer className="pb-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} MarketHub · Demo project
      </footer>
    </div>
  );
}
