import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

const variants = {
  primary: "bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(47,125,104,0.22)] hover:bg-[#256553] hover:shadow-[0_16px_42px_rgba(47,125,104,0.34)]",
  secondary: "bg-secondary text-secondary-foreground shadow-[0_10px_24px_rgba(20,53,47,0.08)] hover:bg-[#c7dfd3] hover:shadow-[0_14px_34px_rgba(47,125,104,0.18)]",
  outline: "border border-border bg-white/74 text-foreground shadow-[0_10px_26px_rgba(199,166,75,0.11)] hover:border-[#c7a64b] hover:bg-white hover:shadow-[0_14px_36px_rgba(199,166,75,0.2)]",
  ghost: "text-foreground hover:bg-white/50 hover:shadow-[0_10px_24px_rgba(47,125,104,0.12)]",
  danger: "bg-destructive text-white shadow-[0_12px_30px_rgba(180,35,53,0.18)] hover:bg-[#941d2b] hover:shadow-[0_16px_42px_rgba(180,35,53,0.28)]",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-2 rounded-[14px] font-semibold transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
