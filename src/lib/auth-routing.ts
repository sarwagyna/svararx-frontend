/**
 * Post-login routing — tier-aware: solo doctors land on prescribe with zero extra steps.
 */
import { getClinicUxContext, getOnboardingStatus, exchangeToken } from "./api";
import { cacheClinicContext, isDoctorSessionActive, resolveEntryPath, setActiveDoctorId, usesClinicDashboard } from "./clinic-session";

export async function ensureApiSession(): Promise<void> {
  await exchangeToken();
}

export async function resolvePostLoginPath(next?: string | null): Promise<string> {
  await ensureApiSession();
  try {
    const status = await getOnboardingStatus();
    if (!status.completed) {
      return "/onboarding";
    }

    const ctx = await getClinicUxContext();
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
