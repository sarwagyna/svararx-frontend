"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureToken, getOnboardingStatus } from "@/lib/api";
import { supabase } from "@/lib/supabase";

/**
 * Redirects to /onboarding if the doctor has not completed setup.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
        if (!status.completed) {
          router.replace("/onboarding");
          return;
        }
        setReady(true);
      } catch {
        router.replace("/onboarding");
      }
    })();
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
