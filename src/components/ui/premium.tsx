import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AmbientNileBackground({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("nile-ambient min-h-dvh", className)} {...props}>
      {children}
    </div>
  );
}

export function PremiumCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "calm-enter min-w-0 rounded-[28px] border border-white/10 bg-[#0d2b26]/72 p-5 text-[#f3eee8] shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl",
        className,
      )}
      {...props}
    />
  );
}

export function SoftPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[24px] border border-[#6fae9b]/18 bg-[#102722]/72 p-4 text-[#f3eee8] shadow-[inset_0_1px_0_rgba(242,234,223,0.06)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}

export function SectionShell({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8", className)} {...props} />;
}

export function CalmGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-4 sm:gap-5 lg:gap-6", className)} {...props} />;
}

export function LuxuryBadge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border border-[#b79a6b]/35 bg-[#b79a6b]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#f2eadf]",
        className,
      )}
      {...props}
    />
  );
}

export function PageHero({ eyebrow, title, description, children, className }: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <PremiumCard className={cn("p-6 sm:p-8 lg:p-10", className)}>
      {eyebrow ? <LuxuryBadge>{eyebrow}</LuxuryBadge> : null}
      <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-[0.96] text-[#f3eee8] sm:text-6xl lg:text-7xl">{title}</h1>
      {description ? <p className="mt-5 max-w-2xl text-base leading-8 text-[#d8cec2] sm:text-lg">{description}</p> : null}
      {children ? <div className="mt-7">{children}</div> : null}
    </PremiumCard>
  );
}

export function ActionCluster({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap", className)} {...props} />;
}

export function EmptyStatePremium({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <PremiumCard className="p-6">
      <h2 className="font-serif text-3xl text-[#f3eee8]">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#cbbfb1]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </PremiumCard>
  );
}

export function LoadingSoft({ label = "Carregando" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#6fae9b]/20 bg-[#0d2b26]/68 px-4 py-2 text-sm text-[#f2eadf]">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
