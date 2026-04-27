import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/domain/metric-card";
import { formatDate } from "@/lib/utils";
import { getSession } from "@/server/auth/session";
import {
  getDashboardMetrics,
  type AdminDashboardMetrics,
  type EmployeeDashboardMetrics
} from "@/server/services/dashboard-service";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const metrics = await getDashboardMetrics(session.role, session.employeeId);

  if (session.role === "EMPLOYEE" && isEmployeeMetrics(metrics)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">A clean MVP shell with role-aware summaries.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Present this month" value={metrics.attendanceThisMonth} />
          <MetricCard label="Leave types tracked" value={metrics.leaveBalances.length} />
          <MetricCard label="Unread announcements" value={metrics.announcements.length} />
        </div>

        <Card title="Announcements">
          <div className="space-y-3">
            {metrics.announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-lg border border-line p-4">
                <p className="font-medium text-ink">{announcement.title}</p>
                <p className="mt-1 text-sm text-slate-600">{announcement.body}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(announcement.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">A clean MVP shell with role-aware summaries.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Headcount" value={isAdminMetrics(metrics) ? metrics.headcount : 0} />
        <MetricCard label="Pending leave requests" value={isAdminMetrics(metrics) ? metrics.pendingLeaves : 0} />
        <MetricCard label="Present today" value={isAdminMetrics(metrics) ? metrics.todayPresence : 0} />
      </div>
    </div>
  );
}

function isEmployeeMetrics(metrics: EmployeeDashboardMetrics | AdminDashboardMetrics): metrics is EmployeeDashboardMetrics {
  return "announcements" in metrics;
}

function isAdminMetrics(metrics: EmployeeDashboardMetrics | AdminDashboardMetrics): metrics is AdminDashboardMetrics {
  return "headcount" in metrics;
}
