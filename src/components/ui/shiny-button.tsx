"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const animationProps = {
  initial: { "--x": "100%", scale: 0.98 },
  animate: { "--x": "-100%", scale: 1 },
  whileTap: { scale: 0.95 },
  transition: {
    repeat: Infinity,
    repeatType: "loop",
    repeatDelay: 1,
    type: "spring",
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring",
      stiffness: 200,
      damping: 5,
      mass: 0.5,
    },
  },
} as const;

interface ShinyButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
}

export const ShinyButton: React.FC<ShinyButtonProps> = ({ children, className, ...props }) => {
  return (
    <motion.button
      {...animationProps}
      {...props}
      className={cn(
        "relative overflow-hidden rounded-[14px] px-6 py-3 font-semibold backdrop-blur-xl transition-shadow duration-300 ease-in-out hover:shadow-[0_18px_46px_rgba(47,125,104,0.24)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(117,184,160,0.14)_0%,transparent_60%)] dark:hover:shadow-[0_0_28px_rgba(117,184,160,0.18)]",
        className,
      )}
    >
      <span
        className="relative z-20 block size-full text-sm uppercase tracking-wide text-[rgba(20,45,41,0.85)] dark:font-light dark:text-[rgba(255,255,255,0.92)]"
        style={{
          maskImage:
            "linear-gradient(-75deg,var(--primary) calc(var(--x) + 20%),transparent calc(var(--x) + 30%),var(--primary) calc(var(--x) + 100%))",
        }}
      >
        {children}
      </span>
      <span
        style={{
          mask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
          maskComposite: "exclude",
        }}
        className="absolute inset-0 z-10 block rounded-[inherit] bg-[linear-gradient(-75deg,rgba(47,125,104,0.13)_calc(var(--x)+20%),rgba(199,166,75,0.58)_calc(var(--x)+25%),rgba(47,125,104,0.13)_calc(var(--x)+100%))] p-px"
      />
    </motion.button>
  );
};

export default ShinyButton;
