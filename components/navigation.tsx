"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { User, LogOut, Menu, LogIn } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
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

  const isActive = (href: string, aliases: readonly string[] = []) =>
    pathname === href ||
    aliases.some((alias) => pathname === alias) ||
    (href !== "/" && pathname.startsWith(`${href}/`));

  const desktopLinks = NAV_LINKS.filter((l) => l.href !== "/");

  return (
    <nav className="sticky top-0 z-40 border-b bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <Image
              src="/ChemCurious_logo_HD.png"
              alt="ChemCurious"
              width={140}
              height={38}
              priority
              className="h-9 w-auto object-contain sm:h-10"
            />
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
            {desktopLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive(item.href, "aliases" in item ? item.aliases : [])
                    ? "text-primary"
                    : "text-gray-700 hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 md:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-[85%] max-w-sm flex-col gap-0 p-0">
          <SheetHeader className="border-b p-4 text-left">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Site navigation</SheetDescription>
            <Image
              src="/ChemCurious_logo_HD.png"
              alt="ChemCurious"
              width={140}
              height={38}
              className="h-9 w-auto object-contain object-left"
            />
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : isActive(item.href, "aliases" in item ? item.aliases : []);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-4 py-3 text-base font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-gray-800 hover:bg-muted active:bg-muted"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t p-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    {user.email && (
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth" onClick={() => setOpen(false)}>
                <Button className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
