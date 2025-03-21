import * as React from "react";
import { Link } from "wouter";
import { Menu } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <nav className="relative flex h-20 items-center w-full">
        <div className="container flex w-full items-center justify-between py-2">
          <Link href="/">
            <div className="text-4xl font-galvij font-bold tracking-tight hover:text-primary transition-colors pl-8">
              Home
            </div>
          </Link>
          
          {/* Empty middle section for the logo to animate into */}
          <div className="flex-grow flex justify-center" style={{ minHeight: '1.5rem' }}>
            {/* Logo will animate into this space */}
          </div>
          
          <div className="absolute right-0 text-3xl font-galvij font-medium pr-4">
            Menu
          </div>
        </div>
      </nav>
    </header>
  );
}