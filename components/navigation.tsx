"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { User, LogOut, Menu, X } from "lucide-react";

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
  const [open, setOpen] = useState(false);

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

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden items-center space-x-2 sm:flex">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {open && (
          <div className="flex flex-col gap-1 border-t py-3 md:hidden">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  linkClass(item.href, "aliases" in item ? item.aliases : []),
                  "rounded-md px-3 py-2.5 hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
