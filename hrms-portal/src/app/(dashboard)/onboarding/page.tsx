import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/domain/metric-card";
import { OnboardingWorkspace } from "@/components/domain/onboarding-workspace";
import { getSession } from "@/server/auth/session";
import { listEmployeesForOnboarding } from "@/server/services/employee-service";
import { listOnboardingDocuments } from "@/server/services/onboarding-service";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session || (session.role !== UserRole.SUPER_ADMIN && session.role !== UserRole.HR_ADMIN)) {
    redirect("/dashboard");
  }

  const [employees, documents] = await Promise.all([
    listEmployeesForOnboarding(),
    listOnboardingDocuments()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Onboarding</h1>
        <p className="mt-1 text-sm text-slate-500">Generate offer, appointment, increment, and experience letters from one admin workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Employees available" value={employees.length} />
        <MetricCard label="Letters generated" value={documents.length} />
        <MetricCard
          label="Letter types active"
          value={new Set(documents.map((document) => document.letterType)).size || 4}
        />
      </div>

      <OnboardingWorkspace
        employees={employees.map((employee) => ({
          id: employee.id,
          label: `${employee.firstName} ${employee.lastName} (${employee.employeeCode})`
        }))}
        documents={documents.map((document) => ({
          id: document.id,
          employeeId: document.employeeId,
          title: document.title,
          letterType: document.letterType,
          notes: document.notes,
          content: document.content,
          issuedAt: document.issuedAt?.toISOString() ?? null,
          createdAt: document.createdAt.toISOString(),
          employee: {
            firstName: document.employee.firstName,
            lastName: document.employee.lastName,
            employeeCode: document.employee.employeeCode,
            user: {
              email: document.employee.user.email
            }
          }
        }))}
      />
    </div>
  );
}
