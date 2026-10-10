"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

export type AdminNavItem = { href: string; label: string };

const tabClass =
  "rounded-brutal border-2 border-ink px-4 py-2 font-bold shadow-brutal transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand";

function isActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** Tabs on wide screens; a dropdown menu on phones, where seven tabs would wrap into rows. */
export function AdminNav({ items, label }: { items: AdminNavItem[]; label: string }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const current = items.find((item) => isActive(pathname, item.href)) ?? items[0];

  return (
    <nav aria-label={label}>
      <ul className="hidden flex-wrap gap-3 sm:flex">
        {items.map((item) => {
          const active = item === current;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${tabClass} block ${active ? "bg-brand" : "bg-white"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* key: a new pathname remounts the menu closed after navigating. */}
      <details key={pathname} ref={menu} className="relative sm:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-brutal border-2 border-ink bg-brand px-4 py-2.5 font-bold shadow-brutal [&::-webkit-details-marker]:hidden">
          {current.label}
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.5 6l4.5 4.5L12.5 6" />
          </svg>
        </summary>
        <ul className="absolute inset-x-0 z-20 mt-2 overflow-hidden rounded-brutal border-2 border-ink bg-white shadow-brutal">
          {items.map((item) => (
            <li key={item.href} className="border-b border-[#dddddd] last:border-b-0">
              <Link
                href={item.href}
                aria-current={item === current ? "page" : undefined}
                onClick={() => menu.current?.removeAttribute("open")}
                className={`block px-4 py-3 font-bold ${item === current ? "bg-brand" : "hover:bg-paper"}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
