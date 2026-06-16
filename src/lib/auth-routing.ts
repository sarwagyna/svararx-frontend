/**
 * Post-login routing — tier-aware: solo doctors land on prescribe with zero extra steps.
 */
import { getClinicUxContext, getOnboardingStatus, exchangeToken } from "./api";
import { cacheClinicContext, cacheOnboardingComplete, isDoctorSessionActive, resolveEntryPath, setActiveDoctorId, usesClinicDashboard } from "./clinic-session";

export async function ensureApiSession(): Promise<void> {
  await exchangeToken();
}

export async function resolvePostLoginPath(next?: string | null): Promise<string> {
  await ensureApiSession();
  try {
    // Onboarding status and clinic context are independent — fetch together.
    const [status, ctxResult] = await Promise.all([
      getOnboardingStatus(),
      getClinicUxContext().catch(() => null),
    ]);
    cacheOnboardingComplete(status.completed);
    if (!status.completed) {
      return "/onboarding";
    }

    const ctx = ctxResult ?? (await getClinicUxContext());
    cacheClinicContext(ctx);

    if (ctx.is_solo && !usesClinicDashboard(ctx) && ctx.doctors[0]) {
      setActiveDoctorId(ctx.doctors[0].id);
    }

    if (next && next !== "/login" && next !== "/signup") {
      if (next === "/" && usesClinicDashboard(ctx) && !isDoctorSessionActive()) {
        return "/clinic";
      }
      if (next !== "/") {
        return next;
      }
    }

    return resolveEntryPath(ctx);
  } catch {
    return "/onboarding";
  }
}

export async function requireOnboardingComplete(): Promise<boolean> {
  try {
    const status = await getOnboardingStatus();
    return status.completed;
  } catch {
    return false;
  }
}
