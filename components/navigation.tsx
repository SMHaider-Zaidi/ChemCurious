"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { User, LogOut } from "lucide-react";

const NAV_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/molecules", label: "3D Molecules" },
  { href: "/periodic-table", label: "Periodic Table", aliases: ["/periodic"] },
  { href: "/reactions", label: "Reactions" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/dashboard", label: "Dashboard", requiresAuth: true },
] as const;

export function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const linkClass = (href: string, aliases: readonly string[] = []) => {
    const isActive =
      pathname === href ||
      aliases.some((alias) => pathname === alias) ||
      (href !== "/" && pathname.startsWith(`${href}/`));

    return cn(
      "text-sm font-medium transition-colors",
      isActive ? "text-primary" : "text-gray-700 hover:text-primary"
    );
  };

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-primary">
              Chemistry Playground
            </Link>
            <div className="hidden space-x-6 md:flex">
              {NAV_LINKS.filter((item) => !("requiresAuth" in item && item.requiresAuth) || user).map(
                (item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={linkClass(
                      item.href,
                      "aliases" in item ? item.aliases : []
                    )}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}