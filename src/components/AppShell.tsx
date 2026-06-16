"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { LogoutButton } from "./LogoutButton";
import { ExitDoctorSessionButton } from "./ExitDoctorSessionButton";
import { isDoctorSessionActive } from "@/lib/clinic-session";
import { BrandLogo } from "./BrandLogo";

interface AppShellProps {
  children: React.ReactNode;
  right?: React.ReactNode;
  hideLogout?: boolean;
}

const iconClass = "w-5 h-5 shrink-0";

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={iconClass}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
    </svg>
  );
}

function PatientsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={iconClass}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function AddPatientIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={iconClass}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path strokeLinecap="round" d="M20 8v6M23 11h-6" />
    </svg>
  );
}

function NewRxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={iconClass}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={iconClass}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={iconClass}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const ACTION_BUTTONS = [
  {
    href: "/patients/new",
    label: "Add Patient",
    icon: <AddPatientIcon />,
    variant: "secondary" as const,
    exact: true,
  },
  {
    href: "/prescribe",
    label: "New Rx",
    icon: <NewRxIcon />,
    variant: "primary" as const,
  },
];

const NAV_LINKS: Array<{
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
}> = [
  { href: "/", label: "Dashboard", icon: <DashboardIcon />, exact: true },
  { href: "/patients", label: "Patients", icon: <PatientsIcon /> },
  { href: "/support", label: "Support", icon: <SupportIcon /> },
  { href: "/settings/profile", label: "Settings", icon: <SettingsIcon /> },
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

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/patients") {
    return (
      pathname === "/patients" ||
      (pathname.startsWith("/patients/") && !pathname.startsWith("/patients/new"))
    );
  }
  return pathname === href || pathname.startsWith(href + "/");
}

function SidebarContent({
  pathname,
  right,
  hideLogout,
  onNavigate,
}: {
  pathname: string;
  right?: React.ReactNode;
  hideLogout?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="px-5 pt-6 pb-4 border-b border-canvas-soft">
        <BrandLogo variant="sidebar" href="/" onClick={onNavigate} />
      </div>

      <div className="px-3 pt-4 pb-3 border-b border-canvas-soft">
        <div className="grid grid-cols-2 gap-2">
          {ACTION_BUTTONS.map(({ href, label, icon, variant, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-center text-xs font-semibold transition-colors",
                  variant === "primary"
                    ? active
                      ? "bg-ink text-green"
                      : "bg-green text-ink hover:bg-green-hover"
                    : active
                      ? "bg-green-pale border border-green text-positive-deep"
                      : "border border-green/50 text-positive-deep hover:bg-green-pale hover:border-green"
                )}
              >
                {icon}
                <span className="leading-tight">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_LINKS.map(({ href, label, icon, exact }) => {
          const active = isActive(pathname, href, exact);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 text-sm font-semibold px-4 py-3 rounded-xl transition-colors",
                active
                  ? "bg-ink text-green"
                  : "text-body hover:text-ink hover:bg-canvas-soft"
              )}
            >
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-canvas-soft space-y-3">
        {right && <div className="px-2 text-xs text-mute">{right}</div>}
        {!hideLogout &&
          (isDoctorSessionActive() ? <ExitDoctorSessionButton /> : <LogoutButton />)}
      </div>
    </>
  );
}

export function AppShell({ children, right, hideLogout }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
        <SidebarContent
          pathname={pathname}
          right={right}
          hideLogout={hideLogout}
          onNavigate={() => setMobileOpen(false)}
        />
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

          <BrandLogo variant="mobile" href="/" showTagline={false} />

          <div className="min-w-[2.5rem] flex justify-end text-xs text-mute">
            {right ?? <span className="w-5" />}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
