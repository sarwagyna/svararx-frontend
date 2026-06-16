"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — merged into /clinic dashboard. */
export default function SelectDoctorRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/clinic");
  }, [router]);

  return null;
}
