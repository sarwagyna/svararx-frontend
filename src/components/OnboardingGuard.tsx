"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureToken, getOnboardingStatus } from "@/lib/api";
import {
  cacheOnboardingComplete,
  getCachedOnboardingComplete,
  isOnboardingStatusFresh,
} from "@/lib/clinic-session";
import { supabase } from "@/lib/supabase";

/**
 * Redirects to /onboarding if the doctor has not completed setup.
 *
 * Stale-while-revalidate: once onboarding is known complete (cached per tab),
 * the page renders instantly and the status is re-checked in the background,
 * so navigating between guarded pages is no longer gated on a round-trip.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (getCachedOnboardingComplete() === true) {
      setReady(true);
      // Recently verified complete — skip the network call entirely.
      if (isOnboardingStatusFresh()) {
        return;
      }
    }

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      try {
        await ensureToken();
        const status = await getOnboardingStatus();
        if (cancelled) return;
        cacheOnboardingComplete(status.completed);
        if (!status.completed) {
          router.replace("/onboarding");
          return;
        }
        setReady(true);
      } catch {
        if (getCachedOnboardingComplete() !== true) {
          router.replace("/onboarding");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-canvas-soft flex items-center justify-center">
        <p className="text-body">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
