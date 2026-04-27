import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function LeavePage() {
  const session = await getSession();

  if (!session?.employeeId) {
    return null;
  }

  const [leaveTypes, requests] = await Promise.all([
    prisma.leaveType.findMany({ orderBy: { name: "asc" } }),
    prisma.leaveRequest.findMany({
      where: { employeeId: session.employeeId },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Leave</h1>
        <p className="mt-1 text-sm text-slate-500">Policy-ready schema with a small MVP request flow.</p>
      </div>

      <Card title="Leave types">
        <div className="grid gap-3 md:grid-cols-3">
          {leaveTypes.map((item) => (
            <div key={item.id} className="rounded-lg border border-line p-4">
              <p className="font-medium text-ink">{item.name}</p>
              <p className="mt-1 text-sm text-slate-500">{item.annualQuota} days annually</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="My requests">
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-lg border border-line p-4">
              <p className="font-medium text-ink">{request.leaveType.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {formatDate(request.startDate)} to {formatDate(request.endDate)} • {request.days} day(s)
              </p>
              <p className="mt-2 text-xs text-slate-500">{request.status}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
