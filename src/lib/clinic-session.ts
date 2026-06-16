/**
 * Clinic vs doctor session — clinic dashboard → PIN → doctor dashboard.
 */
import type { ClinicUxContext } from "./api";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  storeTokens,
} from "./tokens";

const ACTIVE_DOCTOR_KEY = "svararx_active_doctor_id";
const CLINIC_CTX_KEY = "svararx_clinic_ux_context";
const DOCTOR_SESSION_KEY = "svararx_doctor_session";
const CLINIC_ACCESS_KEY = "svararx_clinic_access_token";
const CLINIC_REFRESH_KEY = "svararx_clinic_refresh_token";
const ONBOARDING_DONE_KEY = "svararx_onboarding_complete";
const ONBOARDING_TS_KEY = "svararx_onboarding_complete_ts";
const CLINIC_CTX_TS_KEY = "svararx_clinic_ux_context_ts";

// How long cached bootstrap data (onboarding status, clinic context) is trusted
// without revalidating. During this window, guards skip the network entirely.
export const BOOTSTRAP_TTL_MS = 5 * 60 * 1000;

function _isFresh(tsKey: string, ttlMs: number): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(tsKey);
  if (!raw) return false;
  const ts = Number(raw);
  return Number.isFinite(ts) && Date.now() - ts < ttlMs;
}

export function cacheOnboardingComplete(done: boolean): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ONBOARDING_DONE_KEY, done ? "1" : "0");
  sessionStorage.setItem(ONBOARDING_TS_KEY, String(Date.now()));
}

export function getCachedOnboardingComplete(): boolean | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(ONBOARDING_DONE_KEY);
  return v === null ? null : v === "1";
}

export function isOnboardingStatusFresh(ttlMs: number = BOOTSTRAP_TTL_MS): boolean {
  return _isFresh(ONBOARDING_TS_KEY, ttlMs);
}

export function clearCachedOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ONBOARDING_DONE_KEY);
  sessionStorage.removeItem(ONBOARDING_TS_KEY);
}

export function getActiveDoctorId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACTIVE_DOCTOR_KEY);
}

export function setActiveDoctorId(doctorId: string): void {
  sessionStorage.setItem(ACTIVE_DOCTOR_KEY, doctorId);
}

export function clearActiveDoctorId(): void {
  sessionStorage.removeItem(ACTIVE_DOCTOR_KEY);
}

export function cacheClinicContext(ctx: ClinicUxContext): void {
  sessionStorage.setItem(CLINIC_CTX_KEY, JSON.stringify(ctx));
  sessionStorage.setItem(CLINIC_CTX_TS_KEY, String(Date.now()));
}

export function getCachedClinicContext(): ClinicUxContext | null {
  const raw = sessionStorage.getItem(CLINIC_CTX_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClinicUxContext;
  } catch {
    return null;
  }
}

export function isClinicContextFresh(ttlMs: number = BOOTSTRAP_TTL_MS): boolean {
  return _isFresh(CLINIC_CTX_TS_KEY, ttlMs);
}

export function clearCachedClinicContext(): void {
  sessionStorage.removeItem(CLINIC_CTX_KEY);
  sessionStorage.removeItem(CLINIC_CTX_TS_KEY);
}

export function usesClinicDashboard(ctx: ClinicUxContext): boolean {
  if (ctx.membership_role === "compounder") return false;
  if (ctx.uses_clinic_layer) return true;
  return ctx.practice_mode === "clinic" || ctx.doctor_count > 1;
}

export function isDoctorSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DOCTOR_SESSION_KEY) === "1";
}

function backupClinicTokens(): void {
  const access = getStoredAccessToken();
  const refresh = getStoredRefreshToken();
  if (access) sessionStorage.setItem(CLINIC_ACCESS_KEY, access);
  if (refresh) sessionStorage.setItem(CLINIC_REFRESH_KEY, refresh);
}

export function enterDoctorSession(doctorId: string, access: string, refresh: string): void {
  backupClinicTokens();
  storeTokens(access, refresh);
  sessionStorage.setItem(DOCTOR_SESSION_KEY, "1");
  setActiveDoctorId(doctorId);
}

export function exitDoctorSession(): void {
  const access = sessionStorage.getItem(CLINIC_ACCESS_KEY);
  const refresh = sessionStorage.getItem(CLINIC_REFRESH_KEY);
  if (access && refresh) {
    storeTokens(access, refresh);
  }
  sessionStorage.removeItem(DOCTOR_SESSION_KEY);
  sessionStorage.removeItem(CLINIC_ACCESS_KEY);
  sessionStorage.removeItem(CLINIC_REFRESH_KEY);
  clearActiveDoctorId();
}

export function clearDoctorSession(): void {
  sessionStorage.removeItem(DOCTOR_SESSION_KEY);
  sessionStorage.removeItem(CLINIC_ACCESS_KEY);
  sessionStorage.removeItem(CLINIC_REFRESH_KEY);
  clearActiveDoctorId();
}

export function clearClinicSessionState(): void {
  clearDoctorSession();
  clearCachedClinicContext();
  clearCachedOnboardingComplete();
}

export function resolveEntryPath(ctx: ClinicUxContext): string {
  if (!usesClinicDashboard(ctx)) {
    if (ctx.doctors[0]) {
      setActiveDoctorId(ctx.doctors[0].id);
    }
    return "/prescribe";
  }

  if (ctx.membership_role === "compounder") {
    return "/prescribe";
  }

  if (isDoctorSessionActive()) {
    return "/";
  }

  clearDoctorSession();
  return "/clinic";
}
