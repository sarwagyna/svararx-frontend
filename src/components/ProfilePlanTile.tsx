import Link from "next/link";
import { clsx } from "clsx";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/profile-constants";
import { formatInr, getPlanForTier } from "@/lib/subscription-plans";

interface ProfilePlanTileProps {
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
}

function tierKey(tier: string): SubscriptionTier {
  const key = tier.toLowerCase();
  if (key in SUBSCRIPTION_TIERS) return key as SubscriptionTier;
  return "free";
}

export function ProfilePlanTile({
  subscriptionTier,
  subscriptionExpiresAt,
}: ProfilePlanTileProps) {
  const tier = tierKey(subscriptionTier);
  const tierMeta = SUBSCRIPTION_TIERS[tier];
  const plan = getPlanForTier(subscriptionTier);
  const isFree = tier === "free";

  const expiryLabel = subscriptionExpiresAt
    ? new Date(subscriptionExpiresAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : null;

  return (
    <section
      className={clsx(
        "rounded-xl border p-5 lg:p-6",
        isFree
          ? "border-ink/10 bg-canvas shadow-sm"
          : "border-positive/25 bg-green-pale/30 shadow-sm"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-ink">Your plan</h2>
            <span
              className={clsx(
                "inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                tierMeta.className
              )}
            >
              {tierMeta.label}
            </span>
          </div>

          <p className="text-sm text-body max-w-xl">{plan.description}</p>

          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <li className="text-body">
              <span className="text-mute">Doctors:</span>{" "}
              <span className="font-semibold text-ink">{plan.doctors}</span>
            </li>
            <li className="text-body">
              <span className="text-mute">Prescriptions:</span>{" "}
              <span className="font-semibold text-ink">{plan.prescriptions}</span>
            </li>
            <li className="text-body">
              <span className="text-mute">Migration:</span>{" "}
              <span className="font-semibold text-ink">{plan.migration}</span>
            </li>
          </ul>

          <p className="text-sm text-mute">
            {isFree
              ? `${formatInr(0)} per month`
              : `${formatInr(plan.priceInr)} per ${plan.interval === "annual" ? "year" : "month"}`}
            {expiryLabel && (
              <>
                {" · "}
                <span className="text-body">Renews {expiryLabel}</span>
              </>
            )}
          </p>
        </div>

        <Link
          href="/settings/upgrade"
          className={clsx(
            "inline-flex items-center justify-center rounded-pill px-5 py-2.5 text-sm font-semibold transition-colors shrink-0",
            isFree
              ? "bg-green text-ink hover:bg-green-hover"
              : "border border-ink/20 text-ink hover:bg-canvas-soft"
          )}
        >
          {isFree ? "View plans to upgrade" : "View plans"}
        </Link>
      </div>
    </section>
  );
}
