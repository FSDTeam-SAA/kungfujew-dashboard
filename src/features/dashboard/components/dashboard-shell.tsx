"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { canAccess } from "@/lib/access";
import type { DashboardSection } from "../types";

const navigation = [
  {
    id: "overview",
    label: "Dashboard Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    area: "operations",
  },
  {
    id: "orders",
    label: "Order management",
    href: "/dashboard/orders",
    icon: PackageSearch,
    area: "operations",
  },
  {
    id: "payments",
    label: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    area: "operations",
  },
  {
    id: "customers",
    label: "Customers",
    href: "/dashboard/customers",
    icon: Users,
    area: "operations",
  },
  {
    id: "stories",
    label: "Shipment stories",
    href: "/dashboard/stories",
    icon: Newspaper,
    area: "stories",
  },
  {
    id: "users",
    label: "Staff accounts",
    href: "/dashboard/users",
    icon: Users,
    area: "users",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    area: "settings",
  },
] as const;

function Navigation({
  section,
  onNavigate,
}: {
  section: DashboardSection;
  onNavigate?: () => void;
}) {
  const { data: session } = useSession();
  const visible = navigation.filter((item) =>
    canAccess(session?.user?.role, item.area),
  );

  return (
    <nav aria-label="Dashboard" className="w-full space-y-2">
      {visible.map(({ id, label, href, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          onClick={onNavigate}
          aria-current={section === id ? "page" : undefined}
          className={`flex min-h-12 items-center gap-2 rounded-md px-3 text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#012055] ${section === id ? "bg-[#012055] font-bold text-white" : "text-[#535d70] hover:bg-[#e8eaed]"}`}
        >
          <Icon className="size-5" aria-hidden="true" />
          {label}
        </Link>
      ))}
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/" })}
        className="flex min-h-12 w-full items-center gap-2 rounded-md px-3 text-left text-base text-[#c51b36] hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#012055]"
      >
        <LogOut className="size-5" aria-hidden="true" />
        Log out
      </button>
    </nav>
  );
}

export function DashboardShell({
  section,
  title,
  description,
  children,
}: {
  section: DashboardSection;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#fbfcff] font-sans text-[#222] lg:grid lg:grid-cols-[312px_minmax(0,1fr)]">
      <aside className="border-b border-[#e6e7e6] bg-white p-4 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-6">
        <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:gap-10">
          <Image
            src="/images/dashboard/brand.png"
            alt="Kungfujew"
            width={100}
            height={100}
            className="size-12 lg:size-[100px]"
            priority
          />
          <div className="hidden w-full lg:block">
            <Navigation section={section} />
          </div>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="ml-auto rounded-md p-2 text-[#1d2b4f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#012055] lg:hidden"
                aria-label="Open navigation"
              >
                <Menu aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white p-5 lg:hidden">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <Navigation
                section={section}
                onNavigate={() => setMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-[100px] items-center bg-white px-6 py-5 sm:px-10">
          <div>
            <h1 className="text-2xl font-bold text-[#1d2b4f]">{title}</h1>
            <p className="mt-1 text-xs text-[#6c757d]">{description}</p>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
