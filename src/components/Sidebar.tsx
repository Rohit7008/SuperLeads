"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Calendar, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getLeads } from "@/lib/leads";

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobile, onClose }: SidebarProps = {}) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const handlePrefetch = (href: string) => {
    if (href === "/dashboard/leads" || href === "/dashboard/calendar") {
      queryClient.prefetchQuery({
        queryKey: ["leads"],
        queryFn: getLeads,
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/leads", label: "Leads", icon: Users },
    { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  ];

  const profileLink = { href: "/dashboard/profile", label: "Profile", icon: Users };

  return (
    <aside className={cn(
      "bg-white dark:bg-zinc-950 p-6 flex flex-col h-full",
      !mobile && "w-56 border-r border-border min-h-screen",
      mobile && "w-full border-b border-border"
    )}>
      <div className="px-2 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-black/10">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-none tracking-tight">SuperLeads</h2>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-widest">
            Management Suite
          </p>
        </div>
      </div>

      <div className="space-y-10 flex-1">
        <div>
          <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 opacity-70">
            Main Menu
          </p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  onMouseEnter={() => handlePrefetch(link.href)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-border/50 space-y-1">

        <Link
          href={profileLink.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
            pathname === profileLink.href
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Users className={cn("w-5 h-5", pathname === profileLink.href ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
          {profileLink.label}
        </Link>

        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-bold"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}