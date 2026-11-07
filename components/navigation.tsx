"use client";

import Link from "next/link";
import Image from "next/image";
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
  { href: "/dashboard", label: "Dashboard" },
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
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <Image
              src="/ChemCurious_logo_HD.png"
              alt="ChemCurious"
              width={140}
              height={38}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
            {NAV_LINKS.map((item) => (
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
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 rounded-full bg-slate-100 dark:bg-slate-800/90 px-3 py-1.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs uppercase">
                    {user.name ? user.name.charAt(0) : "U"}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 max-w-[160px] truncate">
                    {user.name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center gap-1.5 text-slate-700 hover:text-red-600 hover:border-red-300 dark:text-slate-300 dark:hover:text-red-400 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <span>Logout</span>
                  <LogOut className="h-4 w-4" />
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
