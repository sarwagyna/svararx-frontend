"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { BrandLogo } from "./BrandLogo";
import { SignOutButton } from "./SignOutButton";

function ClinicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m2-16h14" />
      <path strokeLinecap="round" d="M9 7h1m-1 4h1m4-4h1m-1 4h1" />
    </svg>
  );
}

function DoctorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path strokeLinecap="round" d="M20 8v6M23 11h-6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PricingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5 shrink-0">
      <path strokeLinecap="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
    </svg>
  );
}

function ReferIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

const NAV = [
  { href: "/clinic", label: "Clinic dashboard", icon: <ClinicIcon />, exact: true },
  { href: "/clinic/doctors/new", label: "Add doctor", icon: <DoctorIcon /> },
  { href: "/clinic/settings", label: "Clinic settings", icon: <SettingsIcon /> },
  { href: "/clinic/pricing", label: "Pricing & plans", icon: <PricingIcon /> },
  { href: "/clinic/refer", label: "Refer & earn", icon: <ReferIcon /> },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      {open ? (
        <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
      ) : (
        <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

export function ClinicAppShell({
  children,
  subtitle,
}: {
  children: ReactNode;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-canvas-soft flex">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-ink/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-canvas border-r border-canvas-soft flex flex-col transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="px-5 pt-6 pb-4 border-b border-canvas-soft">
          <BrandLogo variant="sidebar" href="/clinic" />
          {subtitle && <p className="text-xs text-mute mt-2 leading-relaxed">{subtitle}</p>}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 text-sm font-semibold px-4 py-3 rounded-xl transition-colors",
                  active ? "bg-ink text-green" : "text-body hover:text-ink hover:bg-canvas-soft"
                )}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-canvas-soft">
          <SignOutButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-auto">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 bg-canvas border-b border-canvas-soft">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="p-2 -ml-2 rounded-lg text-ink hover:bg-canvas-soft transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <MenuIcon open={mobileOpen} />
          </button>
          <BrandLogo variant="mobile" href="/clinic" showTagline={false} />
          <span className="w-5" />
        </header>
        {children}
      </div>
    </div>
  );
}
