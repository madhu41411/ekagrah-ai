import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none ring-0 placeholder:text-slate-400 focus:border-brand-500"
      )}
      {...props}
    />
  );
}
