import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getSession } from "@/server/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar role={session.role} />
      <div className="flex-1">
        <Topbar email={session.email} role={session.role} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
