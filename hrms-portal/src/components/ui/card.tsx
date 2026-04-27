import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<{
  className?: string;
  title?: string;
  description?: string;
}>;

export function Card({ children, className, title, description }: CardProps) {
  return (
    <section className={cn("rounded-lg border border-line bg-white p-5 shadow-panel", className)}>
      {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
