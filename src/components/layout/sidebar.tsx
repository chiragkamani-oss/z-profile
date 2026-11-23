"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, UserSquare2, Building2, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      title: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["administrator"],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  return (
    <aside className="flex w-64 flex-col justify-between border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-bold text-blue-600 dark:text-blue-400"
          >
            <span>Zprofile</span>
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="truncate text-sm font-medium">{user?.name || "User"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          {user?.role && (
            <Badge variant="outline" className="text-[10px] capitalize">
              {user.role}
            </Badge>
          )}
        </div>
      </div>
    </aside>
  );
}
