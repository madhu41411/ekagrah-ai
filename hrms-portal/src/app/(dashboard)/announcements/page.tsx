import { prisma } from "@/server/db/prisma";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { email: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Announcements</h1>
        <p className="mt-1 text-sm text-slate-500">Broadcast updates with role and department targeting.</p>
      </div>
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <p className="font-medium text-ink">{announcement.title}</p>
            <p className="mt-2 text-sm text-slate-600">{announcement.body}</p>
            <p className="mt-3 text-xs text-slate-400">
              {announcement.createdBy.email} • {formatDate(announcement.createdAt)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
