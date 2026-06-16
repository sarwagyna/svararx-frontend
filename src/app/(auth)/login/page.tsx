"use client";

import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md text-center text-body py-12">Loading…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
