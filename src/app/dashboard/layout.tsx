"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Close mobile menu on route change
  useEffect(() => {
    // Wrap in setTimeout to avoid synchronous state update warning
    const timer = setTimeout(() => setIsMobileOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // ⛔ wait until auth check finishes and ensure authenticated
  if (loading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden border-b p-4 flex items-center justify-between bg-white dark:bg-zinc-950 sticky top-0 z-30">
        <div className="font-bold text-lg">SuperLeads</div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r-0 w-56">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>
                Mobile navigation sidebar for SuperLeads
              </SheetDescription>
            </SheetHeader>
            <Sidebar mobile onClose={() => setIsMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen sticky top-0">
        <Sidebar />
      </div>

      <main className="flex-1 p-2 md:p-4 overflow-x-hidden bg-zinc-50/50 dark:bg-zinc-950/50">{children}</main>
    </div>
  );
}