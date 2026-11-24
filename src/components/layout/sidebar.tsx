"use client";

import { useState, useEffect, useRef } from "react";
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
  Pin,
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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("zprofile_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (!isCollapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    // Reduced hover delay to 180ms for snappy, instant response
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 180);
  };

  const handleMouseLeave = () => {
    if (!isCollapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    // 120ms exit transition
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 120);
  };

  const toggleCollapse = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
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

  // Visual expansion flag
  const isVisuallyExpanded = !isCollapsed || isHovered;

  return (
    <div
      className={cn("relative shrink-0", isCollapsed ? "w-[72px]" : "w-64")}
      style={{
        transition: "width 240ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "sticky top-0 z-40 flex h-screen flex-col justify-between border-r border-border/60 bg-card/95 backdrop-blur-xl will-change-[width,box-shadow]",
          isCollapsed
            ? isHovered
              ? "absolute left-0 top-0 w-64 shadow-2xl ring-1 ring-border/50"
              : "w-[72px]"
            : "w-64"
        )}
        style={{
          transition:
            "width 240ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Brand Header - Zero Horizontal Displacement */}
        <div className="flex h-16 shrink-0 items-center border-b border-border/50 px-4">
          <Link
            href="/dashboard"
            className="flex items-center overflow-hidden whitespace-nowrap font-bold tracking-tight"
            title="Zprofile Talent Platform"
          >
            {/* Fixed Logo Anchor: Stays locked at 16px from left edge */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
              <span className="text-sm font-extrabold">Z</span>
            </div>

            {/* Sliding text label */}
            <div
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                isVisuallyExpanded
                  ? "ml-3 max-w-[140px] opacity-100"
                  : "max-w-0 opacity-0"
              )}
            >
              <div className="flex flex-col">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary bg-clip-text text-sm font-bold text-transparent">
                  Zprofile
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Talent Hub
                </span>
              </div>
            </div>
          </Link>

          {/* Toggle Button */}
          <div
            className={cn(
              "ml-auto overflow-hidden transition-all duration-300 ease-out",
              isVisuallyExpanded
                ? "max-w-[32px] opacity-100"
                : "pointer-events-none max-w-0 opacity-0"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
              title={isCollapsed ? "Pin Sidebar Open" : "Collapse to Hover Rail"}
            >
              {isCollapsed ? (
                <Pin className="h-3.5 w-3.5 text-primary" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation Items - Zero Horizontal Displacement Anchor */}
        <div className="flex-1 space-y-1.5 overflow-y-auto px-3.5 py-4">
          <nav className="space-y-1.5">
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
                    "group relative flex h-11 w-full items-center rounded-xl px-1 transition-colors duration-150",
                    isActive
                      ? "bg-primary/10 font-semibold text-primary shadow-xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {/* Fixed Icon Anchor: 36px x 36px slot. Sits at the EXACT SAME X-coordinate in both states! */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                  </div>

                  {/* Text Label: Unfurls cleanly to the right without ever displacing the icon! */}
                  <div
                    className={cn(
                      "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                      isVisuallyExpanded
                        ? "ml-3 max-w-[150px] opacity-100"
                        : "max-w-0 opacity-0"
                    )}
                  >
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>

                  {/* Active Indicator Dot */}
                  {isActive && isVisuallyExpanded && (
                    <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Panel - Zero Horizontal Displacement Anchor */}
        <div className="shrink-0 border-t border-border/50 p-3">
          <div
            className={cn(
              "flex items-center rounded-xl p-1 transition-colors",
              isVisuallyExpanded && "border border-border/60 bg-muted/30 p-2.5"
            )}
          >
            {/* Fixed Avatar Anchor: Stays permanently locked in place! */}
            <Avatar className="h-9 w-9 shrink-0 shadow-xs ring-1 ring-border/80">
              <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>

            {/* User Details: Glides open to the right */}
            <div
              className={cn(
                "min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                isVisuallyExpanded
                  ? "ml-3 max-w-[140px] opacity-100"
                  : "max-w-0 opacity-0"
              )}
            >
              <p className="truncate text-xs font-semibold text-foreground">
                {user?.name || "User Account"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
