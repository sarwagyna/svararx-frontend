"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy route — redirects to the full patient detail page. */
export default function PatientHistoryRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  useEffect(() => {
    router.replace(`/patients/${patientId}#visits`);
  }, [patientId, router]);

  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
    </div>
  );
}
