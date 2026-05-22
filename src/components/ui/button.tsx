import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

const variants = {
  primary: "bg-[#6fae9b] text-[#071412] shadow-[0_14px_42px_rgba(111,174,155,0.22)] hover:bg-[#8bc8b7] hover:shadow-[0_18px_58px_rgba(111,174,155,0.28)]",
  secondary: "bg-[#1e5f55] text-[#f3eee8] shadow-[0_12px_34px_rgba(30,95,85,0.22)] hover:bg-[#277265]",
  outline: "border border-[#6fae9b]/28 bg-[#0d2b26]/54 text-[#f3eee8] shadow-[inset_0_1px_0_rgba(242,234,223,0.06)] hover:border-[#b79a6b]/55 hover:bg-[#123a34]",
  ghost: "text-[#f3eee8] hover:bg-[#f2eadf]/8 hover:text-[#f2eadf]",
  danger: "bg-destructive text-white shadow-[0_12px_30px_rgba(180,35,53,0.18)] hover:bg-[#941d2b] hover:shadow-[0_16px_42px_rgba(180,35,53,0.28)]",
};

const sizes = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-12 px-5 text-sm",
  lg: "min-h-[3.25rem] px-7 py-3 text-base",
  icon: "h-11 w-11",
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
        "inline-flex min-w-0 items-center justify-center gap-2 rounded-full font-bold transition duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
