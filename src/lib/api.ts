/**
 * SvaraRx API client — typed wrappers around the FastAPI backend.
 * Protected endpoints use HS256 SvaraRx tokens (exchanged after Supabase login).
 */
import { supabase } from "./supabase";
import {
  clearTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeTokens,
} from "./tokens";

function resolveServerApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return "/api/v1";

  let origin = raw.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(origin)) {
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin);
    origin = `${isLocal ? "http" : "https"}://${origin}`;
  }
  return `${origin}/api/v1`;
}

const BASE =
  typeof window !== "undefined" ? "/api/v1" : resolveServerApiBase();

// ─── Types ────────────────────────────────────────────────────

export interface TranscribeResponse {
  transcription: string;
  confidence: number | null;
  corrected: boolean;
  original: string | null;
}

export interface MedicationItem {
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction: string;
  corrected_from: string | null;
  correction_confidence: number | null;
  flagged: boolean;
  allergy_drug?: string | null;
  allergy_warning?: string | null;
}

export interface StructuredPrescription {
  medications: MedicationItem[];
  diagnosis: string;
  advice: string;
  follow_up: string;
  same_as_last_time: boolean;
  chief_complaint?: string | null;
  chief_complaint_tags?: string[];
}

export interface StructureResponse {
  structured: StructuredPrescription;
  raw_llm_output: string | null;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: string;
  phone: string | null;
  abha_id?: string | null;
  created_at: string;
  allergy_count?: number;
}

export interface PatientListItem extends Patient {
  last_visit_at: string | null;
  prescription_count: number;
}

export type PatientSort = "name_asc" | "name_desc" | "recent_visit" | "created_desc";

export interface PatientListFilters {
  q?: string;
  page?: number;
  limit?: number;
  sex?: "M" | "F" | "O" | "";
  ageMin?: number;
  ageMax?: number;
  sort?: PatientSort;
  hasAllergies?: boolean | null;
  visitedWithinDays?: number | null;
}

export interface PaginatedPatientList {
  items: PatientListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PatientSearchResult {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  phone: string | null;
  last_visit_date: string | null;
  prescription_count: number;
}

export interface PatientRecent extends Patient {
  last_visit_at: string | null;
}

export function searchResultToPatient(result: PatientSearchResult): Patient {
  return {
    id: result.id,
    name: result.full_name,
    age: result.age,
    sex: result.gender,
    phone: result.phone,
    created_at: result.last_visit_date ?? new Date().toISOString(),
  };
}

export type BloodSugarType = "fasting" | "pp" | "random";

export interface VitalFlag {
  flag: "high_bp" | "low_bp" | "high_sugar" | "low_spo2";
}

export interface VitalReading {
  id: string;
  consultation_id: string | null;
  patient_id: string;
  doctor_id: string;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  weight_kg: number | null;
  blood_sugar_mg_dl: number | null;
  blood_sugar_type: BloodSugarType | null;
  spo2_percent: number | null;
  temperature_f: number | null;
  pulse_bpm: number | null;
  recorded_at: string;
  flags: VitalFlag[];
}

export interface VitalCreate {
  patient_id: string;
  consultation_id?: string | null;
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  weight_kg?: number | null;
  blood_sugar_mg_dl?: number | null;
  blood_sugar_type?: BloodSugarType | null;
  spo2_percent?: number | null;
  temperature_f?: number | null;
  pulse_bpm?: number | null;
}

export interface VitalRecordResponse {
  vitals: VitalReading;
  flags: VitalFlag[];
}

export interface PatientCreate {
  name: string;
  age: number;
  sex: "M" | "F" | "O" | "Other";
  phone: string;
  abha_id?: string;
}

// doctor_id is omitted — the backend derives it from the JWT
export interface ApproveRequest {
  patient_id: string;
  raw_transcription?: string;
  structured: StructuredPrescription;
  prescription_id?: string;
  consultation_id?: string;
  allergy_acknowledgments?: AllergyAcknowledgment[];
  approval_token?: string;
  approving_doctor_id?: string;
}

export interface ClinicDoctorCard {
  id: string;
  name: string;
  speciality: string;
  has_pin: boolean;
}

export interface ClinicUxContext {
  clinic_id: string;
  clinic_name: string;
  plan: string;
  doctor_count: number;
  is_solo: boolean;
  practice_mode: string;
  uses_clinic_layer: boolean;
  membership_role: string;
  default_path: string;
  requires_doctor_selection: boolean;
  requires_pin_to_approve: boolean;
  can_prescribe_directly: boolean;
  active_doctor_id: string;
  active_doctor_name: string;
  doctors: ClinicDoctorCard[];
}

export interface VerifyPinResponse {
  approval_token: string;
  doctor_id: string;
  doctor_name: string;
  expires_in_seconds: number;
}

export interface AllergyAcknowledgment {
  drug_name: string;
  allergy_drug: string;
  reaction?: string | null;
}

export interface PatientAllergy {
  id: string;
  patient_id: string;
  drug_name: string;
  drug_generic: string | null;
  reaction: string | null;
  severity: "mild" | "moderate" | "severe" | "unknown";
  reported_at: string;
}

export interface PatientAllergyCreate {
  drug_name: string;
  reaction?: string;
  severity?: "mild" | "moderate" | "severe" | "unknown";
}

export interface PatientCondition {
  id: string;
  patient_id: string;
  condition_name: string;
  condition_code: string | null;
  diagnosed_at: string | null;
  status: "active" | "resolved" | "monitoring";
  created_at: string;
}

export interface PatientConditionCreate {
  condition_name: string;
  condition_code?: string;
  diagnosed_at?: string;
}

export interface PatientConditionUpdate {
  status?: "active" | "resolved" | "monitoring";
}

export interface PatientConditionSuggestion {
  id: string;
  patient_id: string;
  condition_name: string;
  evidence_count: number;
  status: "pending" | "confirmed" | "dismissed";
  suggested_at: string;
}

export interface Consultation {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  chief_complaint: string | null;
  chief_complaint_tags: string[];
  started_at: string;
  completed_at: string | null;
  prescription_id: string | null;
}

export interface TimelineEvent {
  type: string;
  label: string;
  detail?: string | null;
  at?: string | null;
}

export interface TimelineVisit {
  visit_id: string;
  date: string;
  events: TimelineEvent[];
}

export interface PatientTimeline {
  patient_id: string;
  visits: TimelineVisit[];
}

export interface EmrHistorySection {
  present_illness: string;
  past_medical_history: string;
  surgical_history: string;
  family_history: string;
  allergy_history: string;
  current_medications: string;
}

export interface EmrDiagnosisSection {
  primary: string;
  secondary: string[];
  icd_code: string | null;
  provisional: string;
}

export interface EmrPrescriptionMed {
  drug_name: string;
  strength: string;
  dose: string;
  frequency: string;
  route: string;
  duration: string;
  food_timing: string;
  notes: string;
}

export interface EmrFollowUpSection {
  instructions: string;
  next_visit_date: string | null;
}

export type ClinicalTestFlag = "normal" | "high" | "low" | "critical" | "unknown";

export interface ClinicalTestResult {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  flag: ClinicalTestFlag;
  sample_date: string | null;
  lab_name: string;
  notes: string;
  source_attachment_id?: string | null;
}

export type RecordAttachmentCategory = "lab_report" | "imaging" | "document" | "other";

export interface RecordAttachment {
  id: string;
  filename: string;
  mime_type: string | null;
  url: string | null;
  uploaded_at?: string | null;
  category?: RecordAttachmentCategory;
  file_size?: number | null;
  ocr_text?: string | null;
  ocr_status?: string | null;
}

export interface EmrRecordContent {
  chief_complaints: string[];
  history: EmrHistorySection;
  examination_findings: string[];
  diagnosis: EmrDiagnosisSection;
  prescription: EmrPrescriptionMed[];
  investigations_ordered: string[];
  clinical_tests: ClinicalTestResult[];
  advice: string[];
  follow_up: EmrFollowUpSection;
}

export interface ConsultationRecord {
  patient: {
    patient_id: string | null;
    full_name: string;
    age: number | null;
    date_of_birth: string | null;
    gender: string;
    phone: string | null;
    address: string | null;
    occupation: string | null;
  };
  visit: {
    visit_id: string;
    date_time: string;
    doctor_name: string;
    department_specialty: string;
    clinic_name: string;
    visit_type: "new" | "follow_up" | "emergency";
  };
  vitals: {
    height_cm: number | null;
    weight_kg: number | null;
    bmi: number | null;
    temperature_f: number | null;
    bp_systolic: number | null;
    bp_diastolic: number | null;
    pulse_bpm: number | null;
    respiratory_rate: number | null;
    spo2_percent: number | null;
    random_blood_sugar_mg_dl: number | null;
    blood_sugar_type: string | null;
    recorded_at: string | null;
  };
  content: EmrRecordContent;
  ai_summary: string | null;
  transcripts: {
    raw: string | null;
    corrected: string | null;
    approved: string | null;
  };
  attachments: RecordAttachment[];
  record_status: "draft" | "approved";
  prescription_id: string | null;
  timeline_preview: TimelineEvent[];
}

export interface PatientConsultationListItem {
  consultation_id: string;
  started_at: string;
  completed_at: string | null;
  visit_type: "new" | "follow_up" | "emergency";
  record_status: "draft" | "approved";
  chief_complaint: string | null;
  diagnosis_primary: string | null;
  prescription_id: string | null;
  ai_summary: string | null;
}

export interface ApproveResponse {
  prescription_id: string;
  pdf_url: string | null;
  pdf_base64: string | null;
  status: string;
}

export interface HistoryDrugItem {
  name: string;
  dose: string;
  frequency: string;
}

export interface VisitHistoryItem {
  id: string;
  created_at: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  drugs: HistoryDrugItem[];
  pdf_url: string | null;
  follow_up_date: string | null;
  status: string;
  consultation_id?: string | null;
}

export interface PaginatedVisitHistory {
  items: VisitHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface VisitHistoryDetail {
  id: string;
  created_at: string;
  approved_at: string | null;
  status: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  drugs: HistoryDrugItem[];
  transcript: string | null;
  advice: string | null;
  follow_up: string | null;
  follow_up_date: string | null;
  pdf_url: string | null;
  raw_transcription: string | null;
  consultation_id?: string | null;
}

export interface PrescriptionSummary {
  id: string;
  created_at: string;
  approved_at: string | null;
  status: string;
  diagnosis: string | null;
  pdf_s3_key: string | null;
  item_count: number;
}

export interface ClinicInfo {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string | null;
  plan: string;
  is_active: boolean;
  created_at: string;
}

export interface DoctorInfo {
  id: string;
  name: string;
  qualifications: string;
  mci_number: string;
  speciality: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminOverview {
  clinic: ClinicInfo;
  doctors: DoctorInfo[];
  total_patients: number;
  total_prescriptions: number;
  total_drugs: number;
  prescriptions_this_month: number;
}

export interface RecentPrescription {
  id: string;
  patient_id: string | null;
  patient_name: string;
  diagnosis: string | null;
  created_at: string;
  approved_at: string | null;
  status: string;
  item_count: number;
  doctor_name?: string | null;
}

export function prescriptionLink(rx: RecentPrescription): string {
  if (rx.status === "draft") {
    const params = new URLSearchParams({ draft: rx.id });
    if (rx.patient_id) params.set("patient", rx.patient_id);
    return `/prescribe?${params.toString()}`;
  }
  if (rx.patient_id) {
    return `/patients/${rx.patient_id}`;
  }
  return `/prescribe?draft=${rx.id}`;
}

export interface DailyCount {
  date: string;
  label: string;
  count: number;
}

export interface PatientSexCount {
  sex: string;
  label: string;
  count: number;
}

export interface DashboardAnalytics {
  rx_by_day: DailyCount[];
  patients_by_day: DailyCount[];
  week_prescriptions: number;
  last_week_prescriptions: number;
  new_patients_week: number;
  last_week_new_patients: number;
  patients_visited_week: number;
  total_active_patients: number;
  patients_with_allergies: number;
  patient_sex_breakdown: PatientSexCount[];
  draft_prescriptions: number;
  completed_prescriptions: number;
  avg_medications_per_rx: number;
}

export interface ClinicDoctorStats {
  id: string;
  name: string;
  speciality: string;
  role: string;
  has_pin: boolean;
  total_prescriptions: number;
  today_prescriptions: number;
  week_prescriptions: number;
  total_patients: number;
}

export interface ClinicDashboardSummary {
  clinic_id: string;
  clinic_name: string;
  plan: string;
  doctor_count: number;
  practice_mode: string;
  doctors: ClinicDoctorStats[];
}

export interface DashboardData {
  total_patients: number;
  total_prescriptions: number;
  today_prescriptions: number;
  recent_prescriptions: RecentPrescription[];
  analytics: DashboardAnalytics;
  clinic: ClinicDashboardSummary | null;
}

export interface PrescriptionDetail {
  id: string;
  patient_id: string | null;
  created_at: string;
  approved_at: string | null;
  status: string;
  structured: StructuredPrescription;
  pdf_s3_key: string | null;
  raw_transcription: string | null;
}

export interface DrugResult {
  id: string;
  brand_name: string;
  generic_name: string;
  category: string | null;
  medicine_type: string;
  score: number | null;
}

export interface CorrectionEntry {
  original: string;
  corrected: string;
  score: number;
}

export interface VoiceCaptureResponse {
  recording_id: string;
  duration_seconds: number;
}

export interface VoiceTranscribeResponse {
  transcript: string;
  engine_used: string;
  confidence: number;
  corrections_made: number;
  duration_ms: number;
}

export interface TranscribeAndStructureResponse {
  raw_transcription: string;
  corrected_transcription: string;
  corrections_made: CorrectionEntry[];
  low_confidence_terms: string[];
  structured: StructuredPrescription;
  prescription_id: string | null;
  processing_time_ms: number;
  groq_error: boolean;
}

export interface DoctorProfile {
  id: string;
  name: string;
  qualifications: string;
  mci_number: string;
  speciality: string;
  clinic_id?: string;
  clinic_role?: string;
  onboarding_step?: number;
  onboarding_completed?: boolean;
}

export interface OnboardingStatus {
  step: number;
  completed: boolean;
  practice_mode: "solo" | "clinic";
  is_solo_onboarding: boolean;
  needs_practice_mode_choice: boolean;
  full_name: string;
  qualifications: string;
  mci_reg_number: string;
  state_council_reg: string;
  specialization: string;
  clinic_name: string;
  clinic_address: string;
  clinic_city: string;
  clinic_state: string;
  clinic_pin: string;
  clinic_phone: string;
  clinic_logo_url: string | null;
  signature_url: string | null;
  referral_code: string;
}

export interface OnboardingStep1Data {
  full_name: string;
  qualifications: string;
  mci_reg_number: string;
  state_council_reg: string;
  specialization: string;
  referral_code?: string;
  practice_mode?: "solo" | "clinic";
}

export interface OnboardingSoloSetupData {
  practice_city?: string;
  practice_phone?: string;
  approval_pin?: string;
}

export interface OnboardingStep2Data {
  clinic_name: string;
  clinic_address: string;
  clinic_city: string;
  clinic_state: string;
  clinic_pin: string;
  clinic_phone: string;
}

export interface DoctorMeProfile {
  id: string;
  full_name: string;
  qualifications: string;
  mci_reg_number: string;
  state_council_reg: string | null;
  specialization: string;
  languages: string[];
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_city: string | null;
  clinic_state: string | null;
  clinic_pin: string | null;
  clinic_phone: string | null;
  clinic_logo_url: string | null;
  signature_url: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  subscription_tier: string;
  subscription_expires_at: string | null;
  practice_mode: "solo" | "clinic";
  has_approval_pin: boolean;
}

export interface UpgradeToClinicData {
  clinic_name: string;
  clinic_address: string;
  clinic_city: string;
  clinic_state: string;
  clinic_pin: string;
  clinic_phone: string;
  approval_pin?: string;
}

export interface ClinicSettings {
  clinic_id: string;
  clinic_name: string;
  clinic_address: string;
  clinic_address_line2: string;
  clinic_city: string;
  clinic_state: string;
  clinic_pin: string;
  clinic_phone: string;
  plan: string;
}

export interface CreateClinicDoctorData {
  full_name: string;
  qualifications: string;
  mci_reg_number: string;
  state_council_reg?: string;
  specialization: string;
  approval_pin: string;
  role?: "doctor" | "compounder";
}

export type DoctorMeUpdate = Partial<{
  full_name: string;
  qualifications: string;
  mci_reg_number: string;
  state_council_reg: string;
  specialization: string;
  languages: string[];
  clinic_name: string;
  clinic_address: string;
  clinic_city: string;
  clinic_state: string;
  clinic_pin: string;
  clinic_phone: string;
}>;

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface DoctorRegisterRequest {
  name: string;
  qualifications: string;
  mci_number: string;
  speciality?: string;
  clinic_name?: string;
  clinic_address_line1?: string;
  clinic_address_line2?: string;
  clinic_city?: string;
  clinic_state?: string;
  clinic_pincode?: string;
  clinic_phone?: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function formatApiError(detail: unknown, status: number): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "object" && item !== null && "msg" in item
          ? String((item as { msg: string }).msg)
          : JSON.stringify(item)
      )
      .join(". ");
  }
  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message: string }).message);
  }
  return `HTTP ${status}`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiError(body?.detail, res.status));
  }
  return res.json() as Promise<T>;
}

async function getSupabaseAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Not authenticated. Please sign in.");
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

async function refreshApiToken(): Promise<string> {
  const refresh = getStoredRefreshToken();
  if (!refresh) {
    throw new Error("Session expired. Please sign in again.");
  }
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refresh}` },
  });
  if (!res.ok) {
    clearTokens();
    throw new Error("Session expired. Please sign in again.");
  }
  const tokens = (await res.json()) as TokenPair;
  storeTokens(tokens.access_token, tokens.refresh_token);
  return tokens.access_token;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  let token = getStoredAccessToken();
  if (!token) {
    await exchangeToken();
    token = getStoredAccessToken();
  }
  if (!token) {
    throw new Error("Not authenticated. Please sign in.");
  }
  return { Authorization: `Bearer ${token}` };
}

async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();
  let res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
  });
  if (res.status === 401) {
    const newToken = await refreshApiToken();
    res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${newToken}`,
      },
    });
  }
  return res;
}

// ─── Auth endpoints ───────────────────────────────────────────

// Coalesce concurrent token exchanges so guards/components mounting together
// don't each fire a separate POST /auth/token round-trip.
let exchangeInFlight: Promise<TokenPair> | null = null;

export async function exchangeToken(): Promise<TokenPair> {
  if (exchangeInFlight) return exchangeInFlight;
  exchangeInFlight = (async () => {
    const headers = await getSupabaseAuthHeader();
    const res = await fetch(`${BASE}/auth/token`, {
      method: "POST",
      headers,
    });
    const tokens = await handleResponse<TokenPair>(res);
    storeTokens(tokens.access_token, tokens.refresh_token);
    return tokens;
  })();
  try {
    return await exchangeInFlight;
  } finally {
    exchangeInFlight = null;
  }
}

/**
 * Ensure a SvaraRx access token exists without forcing a network round-trip
 * when one is already cached. authFetch still handles 401 refresh on its own.
 */
export async function ensureToken(): Promise<void> {
  if (getStoredAccessToken()) return;
  await exchangeToken();
}

export async function getMe(): Promise<DoctorProfile> {
  const res = await authFetch(`${BASE}/auth/me`);
  return handleResponse<DoctorProfile>(res);
}

export async function getClinicUxContext(): Promise<ClinicUxContext> {
  const res = await authFetch(`${BASE}/auth/context`);
  return handleResponse<ClinicUxContext>(res);
}

export async function setDoctorPin(pin: string): Promise<void> {
  const res = await authFetch(`${BASE}/auth/pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) {
    await handleResponse(res);
  }
}

export async function verifyDoctorPin(
  doctorId: string,
  pin: string,
  prescriptionId?: string
): Promise<VerifyPinResponse> {
  const res = await authFetch(`${BASE}/auth/verify-pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      doctor_id: doctorId,
      pin,
      prescription_id: prescriptionId ?? null,
    }),
  });
  return handleResponse<VerifyPinResponse>(res);
}

export async function actAsDoctor(doctorId: string, pin: string): Promise<TokenPair> {
  const { enterDoctorSession } = await import("./clinic-session");
  const res = await authFetch(`${BASE}/auth/act-as-doctor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doctor_id: doctorId, pin }),
  });
  const tokens = await handleResponse<TokenPair>(res);
  enterDoctorSession(doctorId, tokens.access_token, tokens.refresh_token);
  return tokens;
}

export async function registerDoctor(
  data: DoctorRegisterRequest,
  accessToken?: string
): Promise<DoctorProfile> {
  const authHeader = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : await getSupabaseAuthHeader();
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(data),
  });
  return handleResponse<DoctorProfile>(res);
}

// ─── Onboarding ───────────────────────────────────────────────

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const res = await authFetch(`${BASE}/onboarding/status`);
  return handleResponse<OnboardingStatus>(res);
}

export async function submitPracticeMode(
  practice_mode: "solo" | "clinic"
): Promise<{ step: number; completed: boolean }> {
  const res = await authFetch(`${BASE}/onboarding/practice-mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ practice_mode }),
  });
  return handleResponse(res);
}

export async function submitOnboardingStep1(
  data: OnboardingStep1Data
): Promise<{ step: number; completed: boolean }> {
  const res = await authFetch(`${BASE}/onboarding/step1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function submitOnboardingSoloSetup(
  data: OnboardingSoloSetupData
): Promise<{ step: number; completed: boolean }> {
  const res = await authFetch(`${BASE}/onboarding/solo-setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function submitOnboardingStep2(
  data: OnboardingStep2Data
): Promise<{ step: number; completed: boolean }> {
  const res = await authFetch(`${BASE}/onboarding/step2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function submitOnboardingStep3(
  clinicLogo?: File | null,
  signature?: File | null
): Promise<{ step: number; completed: boolean }> {
  const form = new FormData();
  if (clinicLogo) form.append("clinic_logo", clinicLogo);
  if (signature) form.append("signature", signature);
  // Ensure multipart body even when both uploads are skipped (proxy + FastAPI)
  if (!clinicLogo && !signature) {
    form.append("skip_uploads", "1");
  }
  const res = await authFetch(`${BASE}/onboarding/step3`, {
    method: "POST",
    body: form,
  });
  return handleResponse(res);
}

export async function submitVoiceCalibration(
  audio: Blob
): Promise<{ step: number; completed: boolean }> {
  const form = new FormData();
  const typedBlob =
    audio.type && audio.type !== "application/octet-stream"
      ? audio
      : new Blob([audio], { type: "audio/webm" });
  form.append("audio", typedBlob, "calibration.webm");
  const res = await authFetch(`${BASE}/onboarding/voice-calibration`, {
    method: "POST",
    body: form,
  });
  return handleResponse(res);
}

export async function completeOnboarding(): Promise<{ step: number; completed: boolean }> {
  const res = await authFetch(`${BASE}/onboarding/complete`, { method: "POST" });
  const result = await handleResponse<{ step: number; completed: boolean }>(res);
  // Re-exchange to get a clinic-scoped access token
  await exchangeToken();
  return result;
}

// ─── Clinic admin ─────────────────────────────────────────────

export async function getClinicSettings(): Promise<ClinicSettings> {
  const res = await authFetch(`${BASE}/clinic/settings`);
  return handleResponse<ClinicSettings>(res);
}

export async function updateClinicSettings(
  data: Omit<ClinicSettings, "clinic_id" | "plan">
): Promise<ClinicSettings> {
  const res = await authFetch(`${BASE}/clinic/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ClinicSettings>(res);
}

export async function createClinicDoctor(
  data: CreateClinicDoctorData
): Promise<ClinicDoctorCard> {
  const res = await authFetch(`${BASE}/clinic/doctors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ClinicDoctorCard>(res);
}

// ─── Doctor profile (settings) ────────────────────────────────

export interface ReferralStats {
  total_referrals: number;
  paid_referrals: number;
  pending_referrals: number;
  earnings_inr: number;
  reward_per_referral_inr: number;
}

export async function getDoctorProfile(): Promise<DoctorMeProfile> {
  const res = await authFetch(`${BASE}/doctors/me`);
  return handleResponse<DoctorMeProfile>(res);
}

export async function getReferralStats(): Promise<ReferralStats> {
  const res = await authFetch(`${BASE}/doctors/me/referrals`);
  return handleResponse<ReferralStats>(res);
}

export async function updateDoctorProfile(data: DoctorMeUpdate): Promise<DoctorMeProfile> {
  const res = await authFetch(`${BASE}/doctors/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<DoctorMeProfile>(res);
}

export async function upgradeToClinic(data: UpgradeToClinicData): Promise<DoctorMeProfile> {
  const res = await authFetch(`${BASE}/doctors/me/upgrade-to-clinic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const profile = await handleResponse<DoctorMeProfile>(res);
  await exchangeToken();
  return profile;
}

export async function uploadDoctorSignature(file: Blob): Promise<{ signature_url: string }> {
  const form = new FormData();
  form.append("file", file, "signature.png");
  const res = await authFetch(`${BASE}/doctors/me/signature`, { method: "POST", body: form });
  const body = await handleResponse<{ signature_url: string | null }>(res);
  if (!body.signature_url) throw new Error("Upload failed — no URL returned.");
  return { signature_url: body.signature_url };
}

export async function uploadDoctorLogo(file: Blob): Promise<{ clinic_logo_url: string }> {
  const form = new FormData();
  form.append("file", file, "logo.png");
  const res = await authFetch(`${BASE}/doctors/me/logo`, { method: "POST", body: form });
  const body = await handleResponse<{ clinic_logo_url: string | null }>(res);
  if (!body.clinic_logo_url) throw new Error("Upload failed — no URL returned.");
  return { clinic_logo_url: body.clinic_logo_url };
}

// ─── API calls ────────────────────────────────────────────────

export async function captureVoice(audioBlob: Blob): Promise<VoiceCaptureResponse> {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");

  const res = await authFetch(`${BASE}/voice/capture`, {
    method: "POST",
    body: form,
  });
  return handleResponse<VoiceCaptureResponse>(res);
}

export async function transcribeVoiceRecording(
  recordingId: string
): Promise<VoiceTranscribeResponse> {
  const res = await authFetch(`${BASE}/voice/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recording_id: recordingId }),
  });
  return handleResponse<VoiceTranscribeResponse>(res);
}

export async function transcribeAndStructure(
  audioBlob: Blob,
  options?: {
    patientId?: string;
    chiefComplaint?: string | null;
    consultationId?: string;
  }
): Promise<TranscribeAndStructureResponse> {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  if (options?.patientId) form.append("patient_id", options.patientId);
  if (options?.chiefComplaint) form.append("chief_complaint", options.chiefComplaint);
  if (options?.consultationId) form.append("consultation_id", options.consultationId);

  const res = await authFetch(`${BASE}/transcribe-and-structure`, {
    method: "POST",
    body: form,
  });
  return handleResponse<TranscribeAndStructureResponse>(res);
}

export async function getActiveConsultation(): Promise<Consultation | null> {
  const res = await authFetch(`${BASE}/consultations/active`);
  if (res.status === 404) return null;
  return handleResponse<Consultation>(res);
}

export async function startConsultation(body: {
  patient_id?: string;
  chief_complaint?: string | null;
  tags?: string[];
}): Promise<Consultation> {
  const res = await authFetch(`${BASE}/consultations/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<Consultation>(res);
}

export async function completeConsultation(
  consultationId: string,
  prescriptionId?: string
): Promise<Consultation> {
  const res = await authFetch(`${BASE}/consultations/${consultationId}/complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prescription_id: prescriptionId ?? null }),
  });
  return handleResponse<Consultation>(res);
}

export async function getPatientTimeline(patientId: string): Promise<PatientTimeline> {
  const res = await authFetch(`${BASE}/patients/${patientId}/timeline`);
  return handleResponse<PatientTimeline>(res);
}

export async function listPatientConsultations(
  patientId: string
): Promise<PatientConsultationListItem[]> {
  const res = await authFetch(`${BASE}/patients/${patientId}/consultations`);
  return handleResponse<PatientConsultationListItem[]>(res);
}

export async function getConsultationRecord(
  consultationId: string
): Promise<ConsultationRecord> {
  const res = await authFetch(`${BASE}/consultations/${consultationId}/record`);
  return handleResponse<ConsultationRecord>(res);
}

export interface ConsultationRecordUpdate {
  content?: EmrRecordContent;
  ai_summary?: string | null;
  approved_transcript?: string | null;
  record_status?: "draft" | "approved";
  visit_type?: "new" | "follow_up" | "emergency";
}

export async function updateConsultationRecord(
  consultationId: string,
  body: ConsultationRecordUpdate
): Promise<ConsultationRecord> {
  const res = await authFetch(`${BASE}/consultations/${consultationId}/record`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<ConsultationRecord>(res);
}

export async function generateConsultationRecord(
  consultationId: string,
  transcript: string,
  useLlm = true
): Promise<ConsultationRecord> {
  const res = await authFetch(`${BASE}/consultations/${consultationId}/record/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, use_llm: useLlm }),
  });
  return handleResponse<ConsultationRecord>(res);
}

export interface RecordAttachmentOcrResult {
  attachment_id: string;
  ocr_text: string;
  clinical_tests: ClinicalTestResult[];
  lab_name: string | null;
  sample_date: string | null;
  merged_into_record: boolean;
  record: ConsultationRecord | null;
}

export async function uploadRecordAttachment(
  consultationId: string,
  file: File,
  category: RecordAttachmentCategory = "other"
): Promise<RecordAttachment> {
  const form = new FormData();
  form.append("file", file);
  form.append("category", category);
  const res = await authFetch(`${BASE}/consultations/${consultationId}/record/attachments`, {
    method: "POST",
    body: form,
  });
  return handleResponse<RecordAttachment>(res);
}

export async function deleteRecordAttachment(
  consultationId: string,
  attachmentId: string
): Promise<void> {
  const res = await authFetch(
    `${BASE}/consultations/${consultationId}/record/attachments/${attachmentId}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    await handleResponse(res);
  }
}

export async function ocrRecordAttachment(
  consultationId: string,
  attachmentId: string,
  merge = true
): Promise<RecordAttachmentOcrResult> {
  const res = await authFetch(
    `${BASE}/consultations/${consultationId}/record/attachments/${attachmentId}/ocr?merge=${merge}`,
    { method: "POST" }
  );
  return handleResponse<RecordAttachmentOcrResult>(res);
}

export async function openRecordAttachment(
  consultationId: string,
  attachmentId: string,
  filename: string
): Promise<void> {
  const res = await authFetch(
    `${BASE}/consultations/${consultationId}/record/attachments/${attachmentId}/file`
  );
  if (!res.ok) {
    await handleResponse(res);
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  if (filename) link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function approvePrescription(
  body: ApproveRequest
): Promise<ApproveResponse> {
  const res = await authFetch(`${BASE}/prescription/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<ApproveResponse>(res);
}

export async function searchPatients(q: string, limit = 10): Promise<PatientSearchResult[]> {
  const url = new URL(`${BASE}/patients/search`, window.location.origin);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  const res = await authFetch(url.toString());
  return handleResponse<PatientSearchResult[]>(res);
}

export async function getRecentPatients(limit = 8): Promise<PatientRecent[]> {
  const url = new URL(`${BASE}/patients/recent`, window.location.origin);
  url.searchParams.set("limit", String(limit));
  const res = await authFetch(url.toString());
  return handleResponse<PatientRecent[]>(res);
}

export async function linkPrescriptionPatient(
  prescriptionId: string,
  patientId: string
): Promise<PrescriptionDetail> {
  const res = await authFetch(`${BASE}/rx/${prescriptionId}/link-patient`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient_id: patientId }),
  });
  return handleResponse<PrescriptionDetail>(res);
}

export async function updatePatient(
  id: string,
  data: Partial<PatientCreate>
): Promise<Patient> {
  const res = await authFetch(`${BASE}/patients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Patient>(res);
}

export interface LetterheadSettings {
  clinic_name: string;
  clinic_address: string;
  clinic_address_line2: string;
  clinic_city: string;
  clinic_state: string;
  clinic_pin: string;
  clinic_phone: string;
  clinic_logo_url: string | null;
  doctor_name: string;
  qualifications: string;
  mci_reg_number: string;
  state_council_reg: string | null;
  signature_url: string | null;
}

export async function getLetterhead(): Promise<LetterheadSettings> {
  const res = await authFetch(`${BASE}/doctors/me/letterhead`);
  return handleResponse<LetterheadSettings>(res);
}

export async function saveLetterhead(
  data: Omit<LetterheadSettings, "clinic_logo_url" | "doctor_name" | "qualifications" | "mci_reg_number" | "state_council_reg" | "signature_url">
): Promise<LetterheadSettings> {
  const res = await authFetch(`${BASE}/doctors/me/letterhead`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<LetterheadSettings>(res);
}

export async function uploadLetterheadLogo(file: Blob): Promise<{ clinic_logo_url: string }> {
  const form = new FormData();
  form.append("file", file, "logo.png");
  const res = await authFetch(`${BASE}/doctors/me/letterhead/logo`, { method: "POST", body: form });
  const body = await handleResponse<{ clinic_logo_url: string | null }>(res);
  if (!body.clinic_logo_url) throw new Error("Upload failed");
  return { clinic_logo_url: body.clinic_logo_url };
}

export async function getPatient(id: string): Promise<Patient> {
  const res = await authFetch(`${BASE}/patients/${id}`);
  return handleResponse<Patient>(res);
}

export async function getPatientAllergies(patientId: string): Promise<PatientAllergy[]> {
  const res = await authFetch(`${BASE}/patients/${patientId}/allergies`);
  return handleResponse<PatientAllergy[]>(res);
}

export async function addPatientAllergy(
  patientId: string,
  data: PatientAllergyCreate
): Promise<PatientAllergy> {
  const res = await authFetch(`${BASE}/patients/${patientId}/allergies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<PatientAllergy>(res);
}

export async function deletePatientAllergy(
  patientId: string,
  allergyId: string
): Promise<void> {
  const res = await authFetch(`${BASE}/patients/${patientId}/allergies/${allergyId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to remove allergy.");
  }
}

export async function getPatientConditions(patientId: string): Promise<PatientCondition[]> {
  const res = await authFetch(`${BASE}/patients/${patientId}/conditions`);
  return handleResponse<PatientCondition[]>(res);
}

export async function addPatientCondition(
  patientId: string,
  data: PatientConditionCreate
): Promise<PatientCondition> {
  const res = await authFetch(`${BASE}/patients/${patientId}/conditions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<PatientCondition>(res);
}

export async function updatePatientCondition(
  patientId: string,
  conditionId: string,
  data: PatientConditionUpdate
): Promise<PatientCondition> {
  const res = await authFetch(`${BASE}/patients/${patientId}/conditions/${conditionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<PatientCondition>(res);
}

export async function getPatientConditionSuggestions(
  patientId: string
): Promise<PatientConditionSuggestion[]> {
  const res = await authFetch(`${BASE}/patients/${patientId}/condition-suggestions`);
  return handleResponse<PatientConditionSuggestion[]>(res);
}

export async function confirmConditionSuggestion(
  patientId: string,
  suggestionId: string
): Promise<PatientCondition> {
  const res = await authFetch(
    `${BASE}/patients/${patientId}/condition-suggestions/${suggestionId}/confirm`,
    { method: "POST" }
  );
  return handleResponse<PatientCondition>(res);
}

export async function dismissConditionSuggestion(
  patientId: string,
  suggestionId: string
): Promise<void> {
  const res = await authFetch(
    `${BASE}/patients/${patientId}/condition-suggestions/${suggestionId}/dismiss`,
    { method: "POST" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to dismiss suggestion.");
  }
}

export async function listPatients(
  filters: PatientListFilters = {}
): Promise<PaginatedPatientList> {
  const url = new URL(`${BASE}/patients`, window.location.origin);
  if (filters.q) url.searchParams.set("q", filters.q);
  if (filters.page) url.searchParams.set("page", String(filters.page));
  if (filters.limit) url.searchParams.set("limit", String(filters.limit));
  if (filters.sex) url.searchParams.set("sex", filters.sex);
  if (filters.ageMin != null) url.searchParams.set("age_min", String(filters.ageMin));
  if (filters.ageMax != null) url.searchParams.set("age_max", String(filters.ageMax));
  if (filters.sort) url.searchParams.set("sort", filters.sort);
  if (filters.hasAllergies === true) url.searchParams.set("has_allergies", "true");
  if (filters.hasAllergies === false) url.searchParams.set("has_allergies", "false");
  if (filters.visitedWithinDays != null) {
    url.searchParams.set("visited_within_days", String(filters.visitedWithinDays));
  }
  const res = await authFetch(url.toString());
  return handleResponse<PaginatedPatientList>(res);
}

export async function previewLetterheadPdf(): Promise<{ pdf_base64: string; filename: string }> {
  const res = await authFetch(`${BASE}/doctors/me/letterhead/preview`, { method: "POST" });
  return handleResponse(res);
}

export async function createPatient(data: PatientCreate): Promise<Patient> {
  const res = await authFetch(`${BASE}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Patient>(res);
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await authFetch(`${BASE}/dashboard`);
  return handleResponse<DashboardData>(res);
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const res = await authFetch(`${BASE}/admin/overview`);
  return handleResponse<AdminOverview>(res);
}

export async function getPatientHistory(
  patientId: string,
  page = 1,
  limit = 20,
  fresh = false
): Promise<PaginatedVisitHistory> {
  const url = new URL(`${BASE}/patients/${patientId}/history`, window.location.origin);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (fresh) url.searchParams.set("fresh", "true");
  const res = await authFetch(url.toString());
  return handleResponse<PaginatedVisitHistory>(res);
}

export async function getPatientLastVisit(
  patientId: string
): Promise<VisitHistoryDetail> {
  const res = await authFetch(`${BASE}/patients/${patientId}/history/last`);
  return handleResponse<VisitHistoryDetail>(res);
}

export async function getPatientVisitDetail(
  patientId: string,
  prescriptionId: string
): Promise<VisitHistoryDetail> {
  const res = await authFetch(
    `${BASE}/patients/${patientId}/history/${prescriptionId}`
  );
  return handleResponse<VisitHistoryDetail>(res);
}

export async function openPrescriptionPdf(prescriptionId: string): Promise<void> {
  const res = await authFetch(`${BASE}/prescriptions/${prescriptionId}/pdf`);
  if (!res.ok) {
    throw new Error("Failed to load PDF.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function getPrescriptionDetail(
  prescriptionId: string
): Promise<PrescriptionDetail> {
  const res = await authFetch(`${BASE}/prescriptions/${prescriptionId}`);
  return handleResponse<PrescriptionDetail>(res);
}

export async function structureTranscription(
  transcription: string,
  patientId?: string
): Promise<StructureResponse> {
  const res = await authFetch(`${BASE}/structure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcription, patient_id: patientId ?? null }),
  });
  return handleResponse<StructureResponse>(res);
}

export async function searchDrugs(q: string): Promise<DrugResult[]> {
  const url = new URL(`${BASE}/drugs/search`, window.location.origin);
  url.searchParams.set("q", q);
  const res = await authFetch(url.toString());
  return handleResponse<DrugResult[]>(res);
}

export async function recordVitals(data: VitalCreate): Promise<VitalRecordResponse> {
  const res = await authFetch(`${BASE}/vitals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<VitalRecordResponse>(res);
}

export async function getPatientVitals(
  patientId: string,
  limit = 10
): Promise<VitalReading[]> {
  const url = new URL(`${BASE}/patients/${patientId}/vitals`, window.location.origin);
  url.searchParams.set("limit", String(limit));
  const res = await authFetch(url.toString());
  return handleResponse<VitalReading[]>(res);
}

export async function getPatientVitalsLatest(
  patientId: string
): Promise<VitalReading | null> {
  const res = await authFetch(`${BASE}/patients/${patientId}/vitals/latest`);
  if (res.status === 204) return null;
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) return null;
    throw new Error(text || "Failed to load vitals.");
  }
  const data = await res.json();
  return data ?? null;
}
