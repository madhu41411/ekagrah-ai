import { prisma } from "@/server/db/prisma";
import { AttendanceStatus, LeaveRequestStatus, UserRole } from "@prisma/client";

export type EmployeeDashboardMetrics = {
  leaveBalances: Awaited<ReturnType<typeof prisma.leaveBalance.findMany>>;
  announcements: Awaited<ReturnType<typeof prisma.announcement.findMany>>;
  attendanceThisMonth: number;
};

export type AdminDashboardMetrics = {
  headcount: number;
  pendingLeaves: number;
  todayPresence: number;
};

export async function getDashboardMetrics(
  role: UserRole,
  employeeId?: string
): Promise<EmployeeDashboardMetrics | AdminDashboardMetrics> {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  if (role === "EMPLOYEE" && employeeId) {
    const [leaveBalances, announcements, attendanceThisMonth] = await Promise.all([
      prisma.leaveBalance.findMany({
        where: { employeeId, year: today.getFullYear() },
        include: { leaveType: true }
      }),
      prisma.announcement.findMany({
        where: {
          OR: [
            { audienceType: "ALL" },
            { targetRole: "EMPLOYEE" }
          ]
        },
        take: 5,
        orderBy: { createdAt: "desc" }
      }),
      prisma.attendanceRecord.count({
        where: {
          employeeId,
          date: { gte: monthStart },
          status: AttendanceStatus.PRESENT
        }
      })
    ]);

    return {
      leaveBalances,
      announcements,
      attendanceThisMonth
    };
  }

  const [headcount, pendingLeaves, todayPresence] = await Promise.all([
    prisma.employee.count({ where: { deletedAt: null } }),
    prisma.leaveRequest.count({ where: { status: LeaveRequestStatus.PENDING } }),
    prisma.attendanceRecord.count({
      where: {
        date: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
        },
        status: AttendanceStatus.PRESENT
      }
    })
  ]);

  return {
    headcount,
    pendingLeaves,
    todayPresence
  };
}
