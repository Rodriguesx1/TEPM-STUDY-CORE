import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-[14px] border border-input bg-white/85 px-3 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/25 dark:bg-[#172522]/90 dark:text-[#f5eee8] dark:placeholder:text-[#c7ddd5]",
        className,
      )}
      {...props}
    />
  );
}
