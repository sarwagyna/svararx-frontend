type AuthErrorLike =
  | string
  | {
      message?: string;
      status?: number;
    };

/** Map Supabase auth errors to clearer user-facing messages. */
export function mapSupabaseAuthError(error: AuthErrorLike): string {
  if (typeof error !== "string") {
    if (error.status === 429) {
      return "Too many sign-up attempts. Please wait a few minutes and try again.";
    }
    return mapSupabaseAuthError(error.message ?? "Something went wrong. Please try again.");
  }

  const lower = error.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password. If you just signed up, check your inbox to verify your email first.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please verify your email before signing in — check your inbox for the confirmation link.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "This email is already registered. Sign in instead, or use Forgot password.";
  }
  if (lower.includes("password") && lower.includes("weak")) {
    return "Password is too weak. Use at least 8 characters with a mix of letters and numbers.";
  }
  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("email rate limit")
  ) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  return error;
}
