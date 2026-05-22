"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export type DropdownNavItem = {
  id: number;
  label: string;
  subMenus?: {
    title: string;
    items: {
      label: string;
      description: string;
      icon: React.ElementType;
      href: string;
    }[];
  }[];
  link?: string;
};

export function DropdownNavigation({ navItems }: { navItems: DropdownNavItem[] }) {
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [isHover, setIsHover] = useState<number | null>(null);
  const activeMenu = navItems.find((item) => item.label === openMenu && item.subMenus);

  return (
    <nav className="relative z-[90] w-full">
      <div className="flex w-full items-center overflow-x-auto pb-1 lg:justify-center lg:pb-0">
        <ul className="relative flex min-w-max items-center space-x-0 rounded-full border border-border bg-white/70 p-1 shadow-[0_12px_34px_rgba(47,125,104,0.12)] backdrop-blur dark:bg-[#172522]/80">
          {navItems.map((navItem) => (
            <li key={navItem.label} className="relative">
              {navItem.subMenus ? (
                <button
                  type="button"
                  className="group relative flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors duration-300 hover:text-foreground sm:px-4 sm:text-sm"
                  onMouseEnter={() => setIsHover(navItem.id)}
                  onMouseLeave={() => setIsHover(null)}
                  onClick={() => setOpenMenu((current) => (current === navItem.label ? null : navItem.label))}
                >
                  <span className="relative z-10 whitespace-nowrap">{navItem.label}</span>
                  <ChevronDown
                    className={`relative z-10 h-4 w-4 transition-transform duration-300 group-hover:rotate-180 ${openMenu === navItem.label ? "rotate-180" : ""}`}
                  />
                  {(isHover === navItem.id || openMenu === navItem.label) && (
                    <motion.div layoutId="hover-bg" className="absolute inset-0 size-full bg-primary/10" style={{ borderRadius: 99 }} />
                  )}
                </button>
              ) : (
                <a
                  href={navItem.link ?? "#"}
                  className="group relative flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors duration-300 hover:text-foreground sm:px-4 sm:text-sm"
                  onMouseEnter={() => setIsHover(navItem.id)}
                  onMouseLeave={() => setIsHover(null)}
                >
                  <span className="relative z-10 whitespace-nowrap">{navItem.label}</span>
                  {isHover === navItem.id && <motion.div layoutId="hover-bg" className="absolute inset-0 size-full bg-primary/10" style={{ borderRadius: 99 }} />}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {activeMenu?.subMenus && (
          <motion.div
            className="absolute left-0 right-0 top-full z-[100] pt-2"
            layoutId="menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <div className="max-h-[62vh] w-full overflow-y-auto rounded-[16px] border border-border bg-background p-4 shadow-[0_24px_70px_rgba(20,53,47,0.28)] lg:mx-auto lg:w-[min(88vw,820px)]">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {activeMenu.subMenus.map((sub) => (
                  <motion.div layout className="min-w-0" key={sub.title}>
                    <h3 className="mb-4 text-sm font-semibold capitalize text-muted-foreground">{sub.title}</h3>
                    <ul className="space-y-3">
                      {sub.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.label}>
                            <a
                              href={item.href}
                              className="group flex items-start space-x-3 rounded-[14px] p-2 transition hover:bg-secondary"
                              onClick={() => setOpenMenu(null)}
                            >
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-foreground transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                                <Icon className="h-5 w-5 flex-none" />
                              </div>
                              <div className="min-w-0 leading-5">
                                <p className="break-words text-sm font-semibold text-foreground">{item.label}</p>
                                <p className="break-words text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground">{item.description}</p>
                              </div>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
