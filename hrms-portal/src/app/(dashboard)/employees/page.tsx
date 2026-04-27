import { UserRole } from "@prisma/client";
import { EmployeeDirectoryAdmin } from "@/components/domain/employee-directory-admin";
import { EmployeeManagementPanel } from "@/components/domain/employee-management-panel";
import { MetricCard } from "@/components/domain/metric-card";
import { getSession } from "@/server/auth/session";
import { getEmployeeManagementOptions, listEmployees } from "@/server/services/employee-service";

export default async function EmployeesPage() {
  const session = await getSession();
  const employees = await listEmployees();
  const canManage = session?.role === UserRole.SUPER_ADMIN || session?.role === UserRole.HR_ADMIN;
  const managementOptions = canManage ? await getEmployeeManagementOptions() : null;
  const managersCount = employees.filter((employee) =>
    ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(employee.user.role)
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Employees</h1>
        <p className="mt-1 text-sm text-slate-500">Directory, onboarding, and reporting structure in one place.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total employees" value={employees.length} />
        <MetricCard label="People managers" value={managersCount} />
        <MetricCard
          label="Locations tracked"
          value={new Set(employees.map((employee) => employee.workLocation).filter(Boolean)).size}
        />
      </div>

      {canManage && managementOptions ? (
        <EmployeeManagementPanel
          departments={managementOptions.departments.map((department) => ({
            id: department.id,
            label: `${department.name} (${department.code})`
          }))}
          designations={managementOptions.designations.map((designation) => ({
            id: designation.id,
            label: designation.title
          }))}
          managers={managementOptions.managers.map((manager) => ({
            id: manager.id,
            label: `${manager.firstName} ${manager.lastName} (${manager.employeeCode})`
          }))}
        />
      ) : null}

      <EmployeeDirectoryAdmin
        canManage={canManage}
        departments={(managementOptions?.departments ?? []).map((department) => ({
          id: department.id,
          label: `${department.name} (${department.code})`
        }))}
        designations={(managementOptions?.designations ?? []).map((designation) => ({
          id: designation.id,
          label: designation.title
        }))}
        managers={(managementOptions?.managers ?? []).map((manager) => ({
          id: manager.id,
          label: `${manager.firstName} ${manager.lastName} (${manager.employeeCode})`
        }))}
        employees={employees.map((employee) => ({
          id: employee.id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          joiningDate: employee.joiningDate.toISOString(),
          employmentType: employee.employmentType,
          workLocation: employee.workLocation,
          departmentId: employee.departmentId,
          designationId: employee.designationId,
          managerId: employee.managerId,
          departmentName: employee.department?.name ?? null,
          designationTitle: employee.designation?.title ?? null,
          managerName: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : null,
          user: {
            email: employee.user.email,
            role: employee.user.role
          }
        }))}
      />
    </div>
  );
}
