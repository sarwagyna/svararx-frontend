import Link from "next/link";
import { clsx } from "clsx";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/profile-constants";

interface SubscriptionBadgeProps {
  tier: string;
  showUpgrade?: boolean;
  className?: string;
}

export function SubscriptionBadge({
  tier,
  showUpgrade = true,
  className,
}: SubscriptionBadgeProps) {
  const key = (tier.toLowerCase() in SUBSCRIPTION_TIERS
    ? tier.toLowerCase()
    : "free") as SubscriptionTier;
  const meta = SUBSCRIPTION_TIERS[key];

  return (
    <div className={clsx("flex items-center gap-3 flex-wrap", className)}>
      <span
        className={clsx(
          "inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide",
          meta.className
        )}
      >
        {meta.label}
      </span>
      {showUpgrade && (
        <Link
          href="/settings/upgrade"
          className={clsx(
            "text-sm font-semibold transition-colors",
            key === "free"
              ? "text-positive hover:text-positive-deep"
              : "text-mute hover:text-body font-normal"
          )}
        >
          {key === "free" ? "View plans →" : "Manage plan"}
        </Link>
      )}
    </div>
  );
}
