"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

/** Legacy route — redirects to patient record tab on the patient page. */
export default function PatientEmrRedirectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = params.id as string;
  const visit = searchParams.get("visit");

  useEffect(() => {
    const query = new URLSearchParams({ tab: "record" });
    if (visit) query.set("visit", visit);
    router.replace(`/patients/${patientId}?${query.toString()}#record`);
  }, [patientId, visit, router]);

  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
    </div>
  );
}
