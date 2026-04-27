import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
        "transition active:scale-[0.97]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
        variant === "secondary" && "border border-line bg-white text-slate-700 hover:bg-slate-50 shadow-sm",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}
