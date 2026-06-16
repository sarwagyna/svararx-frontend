"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { resolvePostLoginPath } from "@/lib/auth-routing";
import { mapSupabaseAuthError } from "@/lib/auth-errors";
import { storeReferralCode } from "@/lib/referral";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md text-center text-body py-12">Loading…</div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (referralCode) {
      storeReferralCode(referralCode);
    }
  }, [referralCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(mapSupabaseAuthError(authError));
      setLoading(false);
      return;
    }

    if (data.session) {
      try {
        const path = await resolvePostLoginPath("/onboarding");
        router.push(path);
        return;
      } catch {
        // Fall through to email confirmation screen
      }
    }

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-canvas rounded-xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-green-pale rounded-full flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-positive">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2
            className="text-ink mb-2"
            style={{ fontSize: 24, fontWeight: 600, lineHeight: "31.2px", letterSpacing: "-0.48px" }}
          >
            Check your email
          </h2>
          <p className="text-base text-body mb-6">
            We sent a verification link to{" "}
            <span className="font-semibold text-ink">{email}</span>. After verifying,
            sign in to complete your profile setup.
          </p>
          <Link
            href="/login"
            className="inline-block bg-green text-ink font-semibold rounded-xl px-6 py-3 text-base hover:bg-green-hover transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-canvas rounded-xl p-8 shadow-sm">
        <h1
          className="text-ink mb-2"
          style={{ fontSize: 32, fontWeight: 600, lineHeight: "38.4px", letterSpacing: "-0.96px" }}
        >
          Create your account
        </h1>
        <p className="text-base text-body mb-8">
          Sign up in seconds — we&apos;ll guide you through profile setup next.
        </p>

        {referralCode && (
          <div className="mb-6 bg-green-pale border border-green/30 rounded-xl px-4 py-3 text-sm text-positive-deep">
            You were invited to try SvaraRx. Create your account to get started.
          </div>
        )}

        {error && (
          <div className="mb-6 bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-sm text-negative">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.com"
              required
              autoComplete="email"
              className="w-full bg-canvas border border-ink rounded-md px-4 py-3 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
                className="w-full bg-canvas border border-ink rounded-md px-4 py-3 pr-11 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-body transition-colors"
              >
                <EyeIcon open={showPwd} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirmPwd ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
                className="w-full bg-canvas border border-ink rounded-md px-4 py-3 pr-11 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                aria-label={showConfirmPwd ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-body transition-colors"
              >
                <EyeIcon open={showConfirmPwd} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green text-ink font-semibold rounded-xl px-6 py-3 text-base hover:bg-green-hover active:bg-green-neutral transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-body mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-ink hover:text-positive underline underline-offset-2 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
