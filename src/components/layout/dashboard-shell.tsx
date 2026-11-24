"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // If user is not authenticated (e.g. client viewing a shared public dossier link)
  if (status !== "loading" && !session?.user) {
    return (
      <div className="ambient-bg min-h-screen bg-background text-foreground">
        {/* Public Dossier Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
              <span className="text-sm font-extrabold">Z</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-foreground">
                Zprofile Talent Platform
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Verified Enterprise Engineering Portfolio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <LogIn className="h-3.5 w-3.5" />
                Employee Sign In
              </Button>
            </Link>
          </div>
        </header>

        {/* Public Main Content */}
        <main className="mx-auto max-w-5xl p-4 md:p-8">{children}</main>

        {/* Public Footer */}
        <footer className="no-print mt-12 border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Zymr, Inc. Confidential Client-Ready Portfolio.
        </footer>
      </div>
    );
  }

  // Authenticated Employee Dashboard Layout
  return (
    <div className="ambient-bg flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
