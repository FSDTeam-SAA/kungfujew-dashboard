import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  Settings,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import type { DashboardSection } from "../types";

const navigation = [
  {
    id: "overview",
    label: "Dashboard Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "orders",
    label: "Order management",
    href: "/dashboard/orders",
    icon: PackageSearch,
  },
  {
    id: "payments",
    label: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    id: "customers",
    label: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
] as const;

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
  return (
    <div className="min-h-screen bg-[#fbfcff] font-sans text-[#222] lg:grid lg:grid-cols-[312px_minmax(0,1fr)]">
      <aside className="border-b border-[#e6e7e6] bg-white p-4 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-6">
        <div className="flex items-center gap-3 lg:flex-col lg:gap-10">
          <Image
            src="/images/dashboard/brand.png"
            alt="Kungfujew"
            width={100}
            height={100}
            className="size-12 lg:size-[100px]"
            priority
          />
          <nav
            aria-label="Dashboard"
            className="hidden w-full space-y-4 lg:block"
          >
            {navigation.map(({ id, label, href, icon: Icon }) => (
              <Link
                key={id}
                href={href}
                className={`flex h-12 items-center gap-2 rounded-md px-3 text-base transition-colors ${section === id ? "bg-[#012055] font-bold text-[#f8f9fa]" : "text-[#6b6b6b] hover:bg-[#e8eaed]"}`}
              >
                <Icon className="size-6" />
                {label}
              </Link>
            ))}
            <Link
              href="/"
              className="mt-4 flex h-12 items-center gap-2 rounded-md px-3 text-base text-[#e5102e] hover:bg-red-50"
            >
              <LogOut className="size-6" />
              Log Out
            </Link>
          </nav>
          <button
            className="ml-auto rounded-md p-2 text-[#1d2b4f] lg:hidden"
            aria-label="Open navigation"
          >
            <Menu />
          </button>
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
