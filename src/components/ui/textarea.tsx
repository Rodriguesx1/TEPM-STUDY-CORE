import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-[18px] border border-[#6fae9b]/28 bg-[#071412]/35 px-4 py-4 text-sm leading-7 text-[#f3eee8] outline-none transition duration-300 placeholder:text-[#cbbfb1] focus:border-[#b79a6b]/70 focus:ring-2 focus:ring-[#6fae9b]/20 dark:bg-[#071412]/35 dark:text-[#f3eee8] dark:placeholder:text-[#cbbfb1]",
        className,
      )}
      {...props}
    />
  );
}
