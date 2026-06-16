"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClinicUxContext } from "@/lib/api";
import {
  cacheClinicContext,
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
    (async () => {
      try {
        const ctx = await getClinicUxContext();
        cacheClinicContext(ctx);

        if (!usesClinicDashboard(ctx)) {
          setReady(true);
          return;
        }

        if (ctx.membership_role === "compounder") {
          setReady(true);
          return;
        }

        if (!isDoctorSessionActive()) {
          router.replace("/clinic");
          return;
        }

        setReady(true);
      } catch {
        router.replace("/clinic");
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
