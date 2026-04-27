import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">Daily presence, regularization, and summary workflow starter.</p>
      </div>
      <Card title="Quick actions">
        <form action="/api/attendance/check-in" method="post">
          <Button type="submit">Check in for today</Button>
        </form>
      </Card>
    </div>
  );
}
