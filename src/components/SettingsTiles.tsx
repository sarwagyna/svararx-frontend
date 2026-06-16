import Link from "next/link";
import { clsx } from "clsx";
import type { ReactNode } from "react";

type TileAccent = "green" | "ink" | "warning";

interface SettingsTile {
  href: string;
  title: string;
  description: string;
  accent: TileAccent;
  icon: ReactNode;
}

const ACCENT: Record<TileAccent, string> = {
  green: "bg-green-pale text-positive-deep",
  ink: "bg-canvas-soft text-ink",
  warning: "bg-warning/20 text-warning-content",
};

function PricingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
      <path strokeLinecap="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
    </svg>
  );
}

function ReferIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function LetterheadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ClinicTeamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

const TILES: SettingsTile[] = [
  {
    href: "/settings/upgrade",
    title: "Pricing & plans",
    description: "Simple Solo pricing, features, and clinic tiers.",
    accent: "green",
    icon: <PricingIcon />,
  },
  {
    href: "/settings/refer",
    title: "Refer & earn",
    description: "Invite doctors and earn when they subscribe.",
    accent: "warning",
    icon: <ReferIcon />,
  },
  {
    href: "/settings/letterhead",
    title: "Clinic letterhead",
    description: "Logo, signature, and prescription layout.",
    accent: "ink",
    icon: <LetterheadIcon />,
  },
  {
    href: "/settings/profile",
    title: "Profile & clinic",
    description: "Your credentials, clinic address, and languages.",
    accent: "ink",
    icon: <ProfileIcon />,
  },
  {
    href: "/settings/clinic",
    title: "Clinic team",
    description: "Upgrade to multi-doctor clinic or manage team setup.",
    accent: "green",
    icon: <ClinicTeamIcon />,
  },
];

export function SettingsTiles({ currentPath }: { currentPath?: string }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {TILES.map((tile) => {
        const active = currentPath === tile.href;
        return (
          <Link
            key={tile.href}
            href={tile.href}
            className={clsx(
              "group flex gap-4 rounded-xl border p-4 transition-all",
              active
                ? "border-positive/40 bg-green-pale/40 shadow-sm ring-1 ring-positive/20"
                : "border-ink/10 bg-canvas shadow-sm hover:shadow-md hover:border-ink/20"
            )}
          >
            <div
              className={clsx(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                ACCENT[tile.accent]
              )}
            >
              {tile.icon}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-ink group-hover:text-positive transition-colors">
                {tile.title}
              </p>
              <p className="text-xs text-body mt-0.5 leading-relaxed">{tile.description}</p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
