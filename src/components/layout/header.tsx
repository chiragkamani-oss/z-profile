"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ZY";

  const handleSignOut = async () => {
    toast.info("Signing out...");
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Zymr Talent Platform
          </h2>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Internal Profile & Enterprise Client Management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark/Light Mode Switcher */}
        <ThemeToggle />

        <div className="h-4 w-px bg-border" />

        {/* User Profile Info & Sign Out */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold leading-none text-foreground">
              {user?.name || "User"}
            </p>
            <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">
              {user?.role || "Engineer"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="ml-1 h-8 px-2.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Sign out of Zprofile"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
