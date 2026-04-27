import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar({ email, role }: { email: string; role: string }) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
      <div>
        <p className="text-sm text-slate-500">Signed in as</p>
        <p className="font-medium text-ink">{email}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{role}</span>
        <form action="/api/auth/logout" method="post">
          <Button variant="secondary" type="submit" className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </form>
      </div>
    </header>
  );
}
