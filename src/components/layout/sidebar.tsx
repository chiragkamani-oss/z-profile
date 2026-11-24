"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UserSquare2,
  Building2,
  Settings,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["administrator", "manager", "engineer", "partner"],
    },
    {
      title: "Profile Builder",
      href: "/profiles",
      icon: UserSquare2,
      roles: ["administrator", "manager", "engineer", "partner"],
    },
    {
      title: "Clients",
      href: "/clients",
      icon: Building2,
      roles: ["administrator", "manager", "engineer"],
    },
    {
      title: "Admin & RBAC",
      href: "/settings",
      icon: Settings,
      roles: ["administrator"],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ZY";

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-border bg-card transition-colors">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-bold tracking-tight"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
              <span className="text-sm font-extrabold">Z</span>
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary bg-clip-text text-sm font-bold text-transparent">
                Zprofile
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Talent Hub
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="p-3">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Platform Menu
          </p>
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary/10 font-semibold text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.title}</span>
                  {isActive && (
                    <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer Panel */}
      <div className="m-3 rounded-xl border border-border/80 bg-muted/40 p-3 transition-colors">
        <div className="flex items-center gap-3">
          <Avatar className="shadow-xs h-9 w-9 ring-1 ring-border">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {user?.name || "User Account"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2">
          <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Role Access
          </span>
          {user?.role && (
            <Badge
              variant="secondary"
              className="h-4.5 py-0 text-[10px] font-bold uppercase"
            >
              {user.role}
            </Badge>
          )}
        </div>
      </div>
    </aside>
  );
}
