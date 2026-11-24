"use client";

import { useState, useEffect } from "react";
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
  PanelLeftClose,
  PanelLeft,
  Pin,
  PinOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("zprofile_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("zprofile_sidebar_collapsed", String(next));
      if (!next) setIsHovered(false);
      return next;
    });
  };

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

  // The sidebar visually expands if it is either unpinned (expanded) OR if it is in collapsed rail mode and currently hovered
  const isVisuallyExpanded = !isCollapsed || isHovered;

  return (
    <div
      className={cn(
        "relative shrink-0 transition-all duration-300 ease-out",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      <aside
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isCollapsed) setIsHovered(false);
        }}
        className={cn(
          "sticky top-0 z-40 flex h-screen flex-col justify-between border-r border-border/60 bg-card/95 backdrop-blur-xl transition-all duration-300 ease-out",
          isCollapsed
            ? isHovered
              ? "absolute left-0 top-0 w-64 shadow-2xl ring-1 ring-border/50"
              : "w-[72px]"
            : "w-64"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 px-4">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2.5 overflow-hidden font-bold tracking-tight",
              !isVisuallyExpanded && "w-full justify-center"
            )}
            title="Zprofile Talent Platform"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
              <span className="text-sm font-extrabold">Z</span>
            </div>
            {isVisuallyExpanded && (
              <div className="flex flex-col transition-opacity duration-200">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary bg-clip-text text-sm font-bold text-transparent">
                  Zprofile
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Talent Hub
                </span>
              </div>
            )}
          </Link>

          {isVisuallyExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title={isCollapsed ? "Pin Sidebar Open" : "Collapse to Hover Rail"}
            >
              {isCollapsed ? (
                <Pin className="h-3.5 w-3.5 text-primary" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Navigation Items (Independently Scrollable with Sleek Scrollbar) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4">
          {isVisuallyExpanded && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Platform Menu
            </p>
          )}
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
                  title={!isVisuallyExpanded ? item.title : undefined}
                  className={cn(
                    "group relative flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                    isVisuallyExpanded
                      ? "gap-3 px-3 py-2.5"
                      : "h-11 w-full justify-center p-0",
                    isActive
                      ? "bg-primary/10 font-semibold text-primary shadow-xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {isVisuallyExpanded && (
                    <>
                      <span className="truncate">{item.title}</span>
                      {isActive && (
                        <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Panel */}
        <div className="shrink-0 border-t border-border/50 p-3">
          {!isVisuallyExpanded ? (
            <div className="flex justify-center" title={`${user?.name} (${user?.role})`}>
              <Avatar className="h-9 w-9 shadow-xs ring-1 ring-border/80">
                <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 shadow-xs ring-1 ring-border/80">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {user?.name || "User Account"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2">
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
          )}
        </div>
      </aside>
    </div>
  );
}
