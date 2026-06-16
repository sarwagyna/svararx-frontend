"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClinicUxContext } from "@/lib/api";
import type { ClinicUxContext } from "@/lib/api";
import {
  cacheClinicContext,
  getCachedClinicContext,
  isDoctorSessionActive,
  usesClinicDashboard,
} from "@/lib/clinic-session";

/**
 * Doctor routes require an active doctor session when the clinic layer applies.
 */
export function DoctorSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Returns true when the context grants access to the doctor dashboard.
    // Redirects (and returns false) when it does not.
    const evaluate = (ctx: ClinicUxContext): boolean => {
      if (!usesClinicDashboard(ctx)) return true;
      if (ctx.membership_role === "compounder") return true;
      if (!isDoctorSessionActive()) {
        router.replace("/clinic");
        return false;
      }
      return true;
    };

    // Render instantly from cached context (stale-while-revalidate) so the
    // dashboard isn't gated behind a network round-trip on every visit.
    const cached = getCachedClinicContext();
    if (cached && evaluate(cached)) {
      setReady(true);
    }

    (async () => {
      try {
        const ctx = await getClinicUxContext();
        cacheClinicContext(ctx);
        if (evaluate(ctx)) {
          setReady(true);
        }
      } catch {
        if (!cached) router.replace("/clinic");
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
