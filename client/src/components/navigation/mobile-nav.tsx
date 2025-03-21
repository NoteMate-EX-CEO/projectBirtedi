import * as React from "react";
import { Link } from "wouter";

interface NavItem {
  label: string;
  href: string;
}

interface MobileNavProps {
  items: NavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-lg font-medium hover:text-primary transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
