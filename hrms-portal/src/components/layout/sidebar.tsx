import Link from "next/link";
import type { Route } from "next";
import { BriefcaseBusiness, CalendarRange, FileText, LayoutDashboard, Megaphone, Users } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

const navByRole: Record<UserRole, Array<{ href: Route; label: string; icon: typeof LayoutDashboard }>> = {
  SUPER_ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/onboarding", label: "Onboarding", icon: FileText },
    { href: "/attendance", label: "Attendance", icon: BriefcaseBusiness },
    { href: "/leave", label: "Leave", icon: CalendarRange },
    { href: "/announcements", label: "Announcements", icon: Megaphone }
  ],
  HR_ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/onboarding", label: "Onboarding", icon: FileText },
    { href: "/attendance", label: "Attendance", icon: BriefcaseBusiness },
    { href: "/leave", label: "Leave", icon: CalendarRange },
    { href: "/announcements", label: "Announcements", icon: Megaphone }
  ],
  MANAGER: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/attendance", label: "Attendance", icon: BriefcaseBusiness },
    { href: "/leave", label: "Leave", icon: CalendarRange },
    { href: "/announcements", label: "Announcements", icon: Megaphone }
  ],
  EMPLOYEE: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/attendance", label: "Attendance", icon: BriefcaseBusiness },
    { href: "/leave", label: "Leave", icon: CalendarRange },
    { href: "/announcements", label: "Announcements", icon: Megaphone }
  ]
};

export function Sidebar({ role }: { role: UserRole }) {
  return (
    <aside className="hidden min-h-screen w-64 border-r border-line bg-white px-4 py-6 lg:block">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">HRMS Portal</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">People Operations</h1>
      </div>
      <nav className="space-y-1">
        {navByRole[role].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
