import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { listDepartments, listDesignations, listLocations, getRoleStats } from "@/server/services/config-service";
import { listEmployees } from "@/server/services/employee-service";
import { ConfigurationWorkspace } from "@/components/domain/configuration-workspace";

export default async function ConfigurationPage() {
  const session = await getSession();

  if (!session || (session.role !== UserRole.SUPER_ADMIN && session.role !== UserRole.HR_ADMIN)) {
    redirect("/dashboard");
  }

  const [departments, designations, locations, roleStats, employees] = await Promise.all([
    listDepartments(),
    listDesignations(),
    listLocations(),
    getRoleStats(),
    listEmployees()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Configuration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage departments, designations, locations, system roles, and account passwords.
        </p>
      </div>

      <ConfigurationWorkspace
        departments={departments.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          _count: { employees: d._count.employees }
        }))}
        designations={designations.map((d) => ({
          id: d.id,
          title: d.title,
          level: d.level,
          _count: { employees: d._count.employees }
        }))}
        locations={locations.map((l) => ({
          id: l.id,
          name: l.name,
          code: l.code
        }))}
        roleStats={roleStats}
        employees={employees.map((e) => ({
          id: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          employeeCode: e.employeeCode
        }))}
      />
    </div>
  );
}
